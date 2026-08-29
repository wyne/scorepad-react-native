import { useCallback, useEffect, useRef } from 'react';

import * as Haptics from 'expo-haptics';
import { Gesture } from 'react-native-gesture-handler';
import {
    Easing,
    runOnJS,
    SharedValue,
    useAnimatedProps,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';

import { SECONDARY_HOLD_ACTIVATION_MS, SECONDARY_HOLD_INDICATOR_DELAY_MS } from '../interactionConstants';

const STEP_DEG = 30;
const MOVE_THRESHOLD_SQ = 100;

function wrapDelta(delta: number): number {
    'worklet';
    if (delta > 180) return delta - 360;
    if (delta < -180) return delta + 360;
    return delta;
}

interface UseDialGestureProps {
    svValue: SharedValue<number>;
    svNewTotal: SharedValue<number>;
    onChange: (v: number) => void;
    onToggleMode: (active: boolean) => void;
    onSecondaryBump: () => void;
    isSecondary: boolean;
    addendOne: number;
    addendTwo: number;
    menuOpen: boolean;
    center: number;
    radius: number;
    strokeWidth: number;
}

export function useDialGesture({
    svValue,
    svNewTotal,
    onChange,
    onToggleMode,
    onSecondaryBump,
    isSecondary,
    addendOne,
    addendTwo,
    menuOpen,
    center: C,
    radius: R,
    strokeWidth: SW,
}: UseDialGestureProps) {
    // Drag visual state — SharedValues on UI thread, drives SVG via useAnimatedProps
    const svIsDragging = useSharedValue(false);
    const svTrailStartDeg = useSharedValue(0);
    const svInc = useSharedValue(addendOne);
    const svAccDeg = useSharedValue(0);
    const svLastAngle = useSharedValue(0);
    const svStartX = useSharedValue(0);
    const svStartY = useSharedValue(0);
    const svHasMoved = useSharedValue(false);
    const svStartValue = useSharedValue(0);
    const svStartNewTotal = useSharedValue(0);
    const svPendingValue = useSharedValue(0);
    const svLastStep = useSharedValue(0);
    const svDidFlush = useSharedValue(true);
    const holdProgress = useSharedValue(0);

    const isSecondaryRef = useRef(isSecondary);
    isSecondaryRef.current = isSecondary;

    useEffect(() => { svInc.value = isSecondary ? addendTwo : addendOne; }, [isSecondary, addendOne, addendTwo]);

    const lpTimer = useRef<ReturnType<typeof setTimeout>>();
    useEffect(() => () => clearTimeout(lpTimer.current), []);

    const startLongPress = useCallback(() => {
        holdProgress.value = withDelay(
            SECONDARY_HOLD_INDICATOR_DELAY_MS,
            withTiming(1, {
                duration: SECONDARY_HOLD_ACTIVATION_MS - SECONDARY_HOLD_INDICATOR_DELAY_MS,
                easing: Easing.out(Easing.quad),
            }),
        );
        lpTimer.current = setTimeout(() => {
            if (!svHasMoved.value) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                onToggleMode(true);
                svAccDeg.value = 0;
                // Snap ring back on activation
                holdProgress.value = withTiming(0, { duration: 120, easing: Easing.out(Easing.cubic) });
            }
        }, SECONDARY_HOLD_ACTIVATION_MS);
    }, [onToggleMode]);

    const stopLongPress = useCallback(() => {
        clearTimeout(lpTimer.current);
        holdProgress.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) });
    }, []);

    // Cancel any in-progress dial long-press when the menu opens
    useEffect(() => {
        if (menuOpen) stopLongPress();
    }, [menuOpen, stopLongPress]);

    const handleBumpFeedback = useCallback(() => {
        if (isSecondaryRef.current) onSecondaryBump();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [onSecondaryBump]);

    const flushPendingChange = useCallback((newVal: number) => {
        onChange(newVal);
    }, [onChange]);

    const handleDeactivate = useCallback(() => {
        onToggleMode(false);
    }, [onToggleMode]);

    const panGesture = Gesture.Pan()
        .enabled(!menuOpen)
        .minDistance(0)
        .onBegin((e) => {
            svStartValue.value = svValue.value;
            svStartNewTotal.value = svNewTotal.value;
            svPendingValue.value = svValue.value;
            svLastStep.value = 0;
            svDidFlush.value = false;
            svAccDeg.value = 0;
            svHasMoved.value = false;
            svStartX.value = e.x;
            svStartY.value = e.y;

            const dx = e.x - C;
            const dy = e.y - C;
            const angle = Math.atan2(dx, -dy) * 180 / Math.PI;
            svLastAngle.value = angle;
            svTrailStartDeg.value = angle;
            svIsDragging.value = true;

            runOnJS(startLongPress)();
        })
        .onUpdate((e) => {
            const dx2 = e.x - svStartX.value;
            const dy2 = e.y - svStartY.value;
            if (!svHasMoved.value && (dx2 * dx2 + dy2 * dy2) > MOVE_THRESHOLD_SQ) {
                svHasMoved.value = true;
                runOnJS(stopLongPress)();
            }

            const dx = e.x - C;
            const dy = e.y - C;
            const angle = Math.atan2(dx, -dy) * 180 / Math.PI;

            const delta = wrapDelta(angle - svLastAngle.value);
            svAccDeg.value += delta;
            svLastAngle.value = angle;

            const steps = Math.round(svAccDeg.value / STEP_DEG);
            if (steps === svLastStep.value) return;
            svLastStep.value = steps;

            const newVal = svStartValue.value + steps * svInc.value;
            svPendingValue.value = newVal;
            svValue.value = newVal;
            svNewTotal.value = svStartNewTotal.value + newVal - svStartValue.value;
            runOnJS(handleBumpFeedback)();
        })
        .onEnd(() => {
            if (!svDidFlush.value) {
                svDidFlush.value = true;
                if (svPendingValue.value !== svStartValue.value) {
                    runOnJS(flushPendingChange)(svPendingValue.value);
                }
            }
            svIsDragging.value = false;
            svAccDeg.value = 0;
            runOnJS(stopLongPress)();
            runOnJS(handleDeactivate)();
        })
        .onFinalize(() => {
            if (!svDidFlush.value) {
                svDidFlush.value = true;
                if (svPendingValue.value !== svStartValue.value) {
                    runOnJS(flushPendingChange)(svPendingValue.value);
                }
            }
            svIsDragging.value = false;
            svAccDeg.value = 0;
            runOnJS(stopLongPress)();
            runOnJS(handleDeactivate)();
        });

    const ringAnimProps = useAnimatedProps(() => ({
        strokeWidth: SW * (1 + holdProgress.value * 0.35),
    }));
    const trackAnimProps = useAnimatedProps(() => ({
        strokeWidth: SW * (1 + holdProgress.value * 0.35),
    }));

    const notchAnimProps = useAnimatedProps(() => {
        const rad = svLastAngle.value * Math.PI / 180;
        const inner = R - SW / 2 + 6;
        const outer = R + SW / 2 - 6;
        return {
            x1: C + inner * Math.sin(rad),
            y1: C - inner * Math.cos(rad),
            x2: C + outer * Math.sin(rad),
            y2: C - outer * Math.cos(rad),
            strokeOpacity: svIsDragging.value ? 1 : 0,
        };
    });

    const trailAnimProps = useAnimatedProps(() => {
        'worklet';
        const dragging = svIsDragging.value;
        const acc = svAccDeg.value;
        const absAcc = Math.abs(acc);
        if (!dragging || absAcc <= 1 || absAcc >= 360) {
            return { d: 'M 0 0', strokeOpacity: 0 };
        }
        const isCW = acc >= 0;
        const sweepDeg = Math.min(absAcc, 359.9);
        const startDeg = svTrailStartDeg.value;
        const endDeg = isCW ? startDeg + sweepDeg : startDeg - sweepDeg;
        const toRad = (d: number) => d * Math.PI / 180;
        const sx = C + R * Math.sin(toRad(startDeg));
        const sy = C - R * Math.cos(toRad(startDeg));
        const ex = C + R * Math.sin(toRad(endDeg));
        const ey = C - R * Math.cos(toRad(endDeg));
        const largeArc = sweepDeg > 180 ? 1 : 0;
        const sweep = isCW ? 1 : 0;
        return {
            d: `M ${sx} ${sy} A ${R} ${R} 0 ${largeArc} ${sweep} ${ex} ${ey}`,
            strokeOpacity: 0.45,
        };
    });

    const fullCircleAnimProps = useAnimatedProps(() => ({
        strokeOpacity: svIsDragging.value && Math.abs(svAccDeg.value) >= 360 ? 0.9 : 0,
    }));

    return {
        panGesture,
        ringAnimProps,
        trackAnimProps,
        notchAnimProps,
        trailAnimProps,
        fullCircleAnimProps,
    };
}
