import React from 'react';

import { Icon } from '@rneui/base';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { shallowEqual } from 'react-redux';

import { useAppSelector } from '../../../redux/hooks';
import { compareTotals } from '../../../redux/ScoringRules';
import { selectCurrentGame, selectCurrentGameTotals } from '../../../redux/selectors';
import { getPalette } from '../../ColorPalette';
import { useTheme } from '../../theme';
import RematchIcon from '../Icons/RematchIcon';

/**
 * Names joined the way a sentence would list them: "A", "A and B",
 * "A, B and C".
 */
export function joinNames(names: string[]): string {
    if (names.length <= 1) return names[0] ?? '';
    return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * The result of a finished game, in one line above the score table:
 * "Gertrude wins with 298", plus the winning margin when there is a single
 * winner and someone behind them. Renders nothing until the game is locked
 * with winners.
 */
export const GameResultBanner: React.FunctionComponent = () => {
    const theme = useTheme();
    const game = useAppSelector(selectCurrentGame);
    const totals = useAppSelector(selectCurrentGameTotals);
    const winnerIds = game?.winnerIds ?? [];
    const winners = useAppSelector(
        state => winnerIds.map(id => state.players.entities[id]),
        shallowEqual,
    );

    if (!game?.locked || winnerIds.length === 0) return null;

    const totalOf = (id: string) => totals.find(t => t.id === id)?.total ?? 0;
    const names = winners.map(p => p?.playerName ?? '');
    const winningTotal = totalOf(winnerIds[0]);

    const runnerUp = totals
        .filter(t => !winnerIds.includes(t.id))
        .sort((a, b) => compareTotals(game.scoring, a.total, b.total))[0];
    const margin = winnerIds.length === 1 && runnerUp
        ? Math.abs(winningTotal - runnerUp.total)
        : undefined;

    const palette = getPalette(game.palette || 'original') || getPalette('original');
    const seat = game.playerIds.indexOf(winnerIds[0]);
    const color = winners[0]?.color || palette[Math.max(seat, 0) % palette.length];

    return (
        <Animated.View
            entering={FadeIn}
            testID="game-result-banner"
            style={[styles.banner, { backgroundColor: theme.backgroundSecondary }]}
        >
            <View style={[styles.bannerDot, { backgroundColor: color }]} />
            <Text style={[styles.bannerText, { color: theme.text }]} numberOfLines={1}>
                <Text style={styles.bannerName}>{joinNames(names)}</Text>
                {winnerIds.length > 1 ? ' win with ' : ' wins with '}
                {winningTotal}
            </Text>
            {margin !== undefined && margin > 0 &&
                <Text style={[styles.bannerMargin, { color: theme.textSecondary }]}>
                    by {margin}
                </Text>
            }
        </Animated.View>
    );
};

interface RowProps {
    icon: React.JSX.Element;
    label: string;
    color: string;
    onPress: () => void;
    showChevron?: boolean;
    showSeparator?: boolean;
    testID?: string;
}

const ActionRow: React.FunctionComponent<RowProps> = ({ icon, label, color, onPress, showChevron, showSeparator, testID }) => {
    const theme = useTheme();

    return (
        <>
            {showSeparator && <View style={[styles.separator, { backgroundColor: theme.separator }]} />}
            <TouchableOpacity
                activeOpacity={0.6}
                accessibilityRole="button"
                accessibilityLabel={label}
                onPress={onPress}
                style={styles.row}
                testID={testID}
            >
                <View style={styles.rowIcon}>{icon}</View>
                <Text style={[styles.rowLabel, { color }]}>{label}</Text>
                {showChevron && <Icon name="chevron-forward" type="ionicon" size={18} color={theme.textTertiary} />}
            </TouchableOpacity>
        </>
    );
};

interface Props {
    locked: boolean;
    onShare: () => void;
    onChooseWinners: () => void;
    onUnlock: () => void;
    onRematch: () => void;
    onReset: () => void;
    onEditGame: () => void;
}

/**
 * What can be done with the game, below the score table. It follows the
 * game's state: while it is being played, Choose Winners is the main action
 * and the rest are rows, Reset in red; once it is locked, Rematch takes over
 * and the only row left is Unlock. Share is always beside the main action.
 *
 * Each state's rows are keyed so a lock or unlock fades the new set in,
 * rather than animating layout (which would also fire while the sheet is
 * dragged and resized).
 */
const GameSheetActions: React.FunctionComponent<Props> = ({ locked, onShare, onChooseWinners, onUnlock, onRematch, onReset, onEditGame }) => {
    const theme = useTheme();

    return (
        <View style={styles.container}>
            <Animated.View
                key={locked ? 'locked' : 'unlocked'}
                entering={FadeIn.duration(250)}
                style={[styles.group, { backgroundColor: theme.backgroundSecondary }]}
            >
                {locked ? (
                    <ActionRow
                        icon={<Icon name="lock-open-outline" type="ionicon" size={20} color={theme.warning} />}
                        label="Unlock to keep scoring"
                        color={theme.text}
                        onPress={onUnlock}
                        testID="unlock-button"
                    />
                ) : (
                    <>
                        <ActionRow
                            icon={<Icon name="create-outline" type="ionicon" size={20} color={theme.tint} />}
                            label="Edit game & players"
                            color={theme.text}
                            onPress={onEditGame}
                            showChevron
                            testID="edit-game-and-players"
                        />
                        <ActionRow
                            icon={<RematchIcon fill={theme.tint} />}
                            label="Rematch"
                            color={theme.text}
                            onPress={onRematch}
                            showSeparator
                            testID="rematch-button"
                        />
                        <ActionRow
                            icon={<Icon name="trash-outline" type="ionicon" size={20} color={theme.destructive} />}
                            label="Reset scores"
                            color={theme.destructive}
                            onPress={onReset}
                            showSeparator
                            testID="reset-button"
                        />
                    </>
                )}
            </Animated.View>

            <View style={styles.buttons}>
                <TouchableOpacity
                    activeOpacity={0.6}
                    accessibilityRole="button"
                    accessibilityLabel="Share"
                    onPress={onShare}
                    style={[styles.button, styles.secondaryButton, { backgroundColor: theme.backgroundSecondary }]}
                    testID="share-button"
                >
                    <Icon name="share-outline" type="ionicon" size={20} color={theme.tint} />
                    <Text style={[styles.buttonLabel, { color: theme.tint }]}>Share</Text>
                </TouchableOpacity>

                {locked ? (
                    <TouchableOpacity
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Rematch"
                        onPress={onRematch}
                        style={[styles.button, styles.primaryButton, { backgroundColor: theme.tint }]}
                        testID="rematch-primary-button"
                    >
                        <RematchIcon fill="#FFFFFF" />
                        <Text style={[styles.buttonLabel, styles.primaryLabel]}>Rematch</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Choose Winners"
                        onPress={onChooseWinners}
                        style={[styles.button, styles.primaryButton, { backgroundColor: theme.success }]}
                        testID="choose-winners-button"
                    >
                        <Icon name="trophy-outline" type="ionicon" size={20} color="#FFFFFF" />
                        <Text style={[styles.buttonLabel, styles.primaryLabel]}>Choose Winners</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 16,
        marginHorizontal: 5,
        marginTop: 6,
    },
    group: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        marginLeft: 50,
    },
    row: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 12,
        minHeight: 48,
        paddingHorizontal: 14,
    },
    rowIcon: {
        alignItems: 'center',
        width: 24,
    },
    rowLabel: {
        flex: 1,
        fontSize: 17,
    },
    buttons: {
        flexDirection: 'row',
        gap: 10,
    },
    button: {
        alignItems: 'center',
        borderRadius: 12,
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'center',
        minHeight: 50,
    },
    secondaryButton: {
        paddingHorizontal: 20,
    },
    primaryButton: {
        flex: 1,
        paddingHorizontal: 16,
    },
    buttonLabel: {
        fontSize: 17,
        fontWeight: '600',
    },
    primaryLabel: {
        color: '#FFFFFF',
    },
    banner: {
        alignItems: 'center',
        borderRadius: 10,
        flexDirection: 'row',
        gap: 8,
        marginBottom: 10,
        marginHorizontal: 5,
        minHeight: 40,
        paddingHorizontal: 12,
    },
    bannerDot: {
        borderRadius: 5,
        height: 10,
        width: 10,
    },
    bannerText: {
        flex: 1,
        fontSize: 15,
    },
    bannerName: {
        fontWeight: '700',
    },
    bannerMargin: {
        fontSize: 15,
        fontVariant: ['tabular-nums'],
        fontWeight: '600',
    },
});

export default GameSheetActions;
