import React, { useMemo, useRef, useState } from 'react';

import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Icon } from '@rneui/base';
import * as Sharing from 'expo-sharing';
import {
    Platform,
    ScrollView,
    Share,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
    ViewInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

import { useAppSelector } from '../../redux/hooks';
import { selectCurrentGame } from '../../redux/selectors';
import { logEvent } from '../Analytics';
import { FOLD_GAP } from '../hooks/useExpandedGameLayout';
import { ThemeColors, useTheme } from '../theme';

import {
    buildShareRows,
    buildShareText,
    describeGame,
    describeResult,
    ShareFormat,
    ShareResult,
    ShareRow,
} from './shareContent';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const FORMATS: [ShareFormat, string][] = [
    ['scoreboard', 'Scoreboard'],
    ['standings', 'Standings'],
    ['winner', 'Winner'],
];

// Wide enough for options and preview side by side: an unfolded foldable or
// a phone in landscape.
const TWO_PANE_MIN_WIDTH = 700;

const SIDE_PADDING = 16;
const ROW_HEIGHT = 34;

interface CardProps {
    title: string;
    details: string;
    format: ShareFormat;
    rows: ShareRow[];
    result: ShareResult;
    showRounds: boolean;
    showDetails: boolean;
    minWidth: number;
    theme: ThemeColors;
}

const Footer: React.FunctionComponent<{ color: string }> = ({ color }) => (
    <Text style={[styles.footer, { color }]}>ScorePad with Rounds</Text>
);

const ScoreboardTable: React.FunctionComponent<{ rows: ShareRow[]; result: ShareResult; showRounds: boolean; theme: ThemeColors }> = ({
    rows, result, showRounds, theme,
}) => {
    const roundCount = showRounds ? rows[0]?.scores.length ?? 0 : 0;
    const header = (label: string, align: 'left' | 'center' = 'center') => (
        <Text style={[styles.th, { color: theme.textTertiary, textAlign: align }]}>{label}</Text>
    );
    const cellStyle = (index: number) => [styles.td, index > 0 && { borderTopColor: theme.separator, borderTopWidth: StyleSheet.hairlineWidth }];

    return (
        <View style={styles.table} testID="share-scoreboard">
            <View>
                {header('#')}
                {rows.map((row, i) => (
                    <View key={row.id} style={cellStyle(i)}>
                        <Text style={[styles.rank, { color: theme.textTertiary }]}>{row.rank}</Text>
                    </View>
                ))}
            </View>
            <View style={styles.nameColumn}>
                {header('Player', 'left')}
                {rows.map((row, i) => (
                    <View key={row.id} style={[cellStyle(i), styles.nameCell]}>
                        <View style={[styles.colorBar, { backgroundColor: row.color, borderColor: theme.separator }]} />
                        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{row.name}</Text>
                        {result.winnerIds.includes(row.id) && <Text style={styles.crown}> ♛</Text>}
                    </View>
                ))}
            </View>
            <View style={[styles.totalColumn, roundCount > 0 && { borderRightColor: theme.separator, borderRightWidth: StyleSheet.hairlineWidth }]}>
                {header('Total')}
                {rows.map((row, i) => (
                    <View key={row.id} style={cellStyle(i)}>
                        <Text style={[styles.total, { color: theme.text }]}>{row.total}</Text>
                    </View>
                ))}
            </View>
            {[...Array(roundCount).keys()].map(round => (
                <View key={round} style={styles.roundColumn} testID={`share-round-${round}`}>
                    {header(`${round + 1}`)}
                    {rows.map((row, i) => (
                        <View key={row.id} style={cellStyle(i)}>
                            <Text style={[styles.score, { color: theme.textSecondary }]}>{row.scores[round]}</Text>
                        </View>
                    ))}
                </View>
            ))}
        </View>
    );
};

const Standings: React.FunctionComponent<{ rows: ShareRow[]; theme: ThemeColors }> = ({ rows, theme }) => {
    const best = Math.max(1, ...rows.map(row => Math.abs(row.total)));
    return (
        <View style={styles.standings} testID="share-standings">
            {rows.map(row => (
                <View key={row.id} style={styles.standingRow}>
                    <Text style={[styles.standingRank, { color: theme.textTertiary }]}>{row.rank}</Text>
                    <View style={styles.standingTrack}>
                        <View style={[
                            styles.standingBar,
                            { backgroundColor: row.color, width: `${Math.max(45, (Math.abs(row.total) / best) * 100)}%` },
                        ]}>
                            <Text style={[styles.standingName, { color: row.textColor }]} numberOfLines={1}>{row.name}</Text>
                            <Text style={[styles.standingTotal, { color: row.textColor }]}>{row.total}</Text>
                        </View>
                    </View>
                </View>
            ))}
        </View>
    );
};

const ShareCard: React.FunctionComponent<CardProps> = ({
    title, details, format, rows, result, showRounds, showDetails, minWidth, theme,
}) => {
    if (format === 'winner') {
        const winners = rows.filter(row => result.winnerIds.includes(row.id));
        const rest = rows.filter(row => !result.winnerIds.includes(row.id));
        const lead = winners[0];
        const fg = lead?.textColor ?? theme.text;
        return (
            <View style={[styles.card, styles.winnerCard, { minWidth, backgroundColor: lead?.color ?? theme.backgroundSecondary }]}>
                <Text style={[styles.winnerTitle, { color: fg }]}>{title}</Text>
                {showDetails && <Text style={[styles.winnerDetails, { color: fg }]}>{details}</Text>}
                <Text style={styles.winnerCrown}>♛</Text>
                <Text style={[styles.winnerName, { color: fg }]} numberOfLines={2}>
                    {winners.map(row => row.name).join(' & ')}
                </Text>
                <Text style={[styles.winnerTotal, { color: fg }]}>{lead?.total ?? ''}</Text>
                {result.margin != null && (
                    <Text style={[styles.winnerMargin, { color: fg }]}>
                        {result.margin === 1 ? 'by 1 point' : `by ${result.margin} points`}
                    </Text>
                )}
                {rest.length > 0 && (
                    <View style={[styles.winnerRest, { backgroundColor: theme.backgroundSecondary }]}>
                        {rest.map((row, i) => (
                            <View key={row.id} style={[
                                styles.winnerRestRow,
                                i > 0 && { borderTopColor: theme.separator, borderTopWidth: StyleSheet.hairlineWidth },
                            ]}>
                                <Text style={[styles.rank, { color: theme.textTertiary }]}>{row.rank}</Text>
                                <View style={[styles.colorBar, { backgroundColor: row.color, borderColor: theme.separator }]} />
                                <Text style={[styles.name, styles.flex, { color: theme.text }]} numberOfLines={1}>{row.name}</Text>
                                <Text style={[styles.total, { color: theme.text }]}>{row.total}</Text>
                            </View>
                        ))}
                    </View>
                )}
                <Footer color={fg} />
            </View>
        );
    }

    return (
        <View style={[styles.card, { minWidth, backgroundColor: theme.backgroundSecondary }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
            {showDetails && <Text style={[styles.cardDetails, { color: theme.textSecondary }]}>{details}</Text>}
            {result.headline !== '' && (
                <View style={[styles.headline, { backgroundColor: theme.backgroundTertiary }]}>
                    <View style={[styles.headlineDot, { backgroundColor: rows.find(row => result.winnerIds.includes(row.id))?.color, borderColor: theme.separator }]} />
                    <Text style={[styles.headlineText, { color: theme.text }]} numberOfLines={1}>{result.headline}</Text>
                    {result.margin != null && <Text style={[styles.headlineMargin, { color: theme.textSecondary }]}>+{result.margin}</Text>}
                </View>
            )}
            {format === 'scoreboard'
                ? <ScoreboardTable rows={rows} result={result} showRounds={showRounds} theme={theme} />
                : <Standings rows={rows} theme={theme} />}
            <Footer color={theme.textTertiary} />
        </View>
    );
};

const ShareScreen: React.FunctionComponent<Props> = ({ navigation }) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const game = useAppSelector(selectCurrentGame);
    const players = useAppSelector(state => state.players.entities);
    const cardRef = useRef<ViewInstance>(null);

    const [format, setFormat] = useState<ShareFormat>('scoreboard');
    const [showRounds, setShowRounds] = useState(true);
    const [showDetails, setShowDetails] = useState(true);

    const rows = useMemo(() => (game ? buildShareRows(game, players) : []), [game, players]);
    const result = useMemo(() => (game ? describeResult(game, rows) : { winnerIds: [], headline: '' }), [game, rows]);

    if (game == undefined) return null;

    const twoPane = width >= TWO_PANE_MIN_WIDTH && width > height;
    const paneWidth = twoPane
        ? (width - insets.left - insets.right - FOLD_GAP) / 2
        : width - insets.left - insets.right;
    const cardMinWidth = paneWidth - SIDE_PADDING * 2;

    const shareImage = async () => {
        if (cardRef.current == null) return;

        try {
            const uri = await captureRef(cardRef.current, {
                result: 'tmpfile',
                quality: 1,
                format: 'png',
                fileName: Platform.OS === 'android' ? 'scorepad-scoreboard' : undefined,
            });

            await Sharing.shareAsync(uri, {
                mimeType: 'image/png',
                dialogTitle: 'Share Scoreboard',
                UTI: 'image/png',
            });

            void logEvent('share_image', { format, rounds_shown: showRounds, details_shown: showDetails });
        } catch (error) {
            console.error('Failed to capture or share image:', error);
        }
    };

    const shareText = async () => {
        try {
            await Share.share({ message: buildShareText(game, rows, { showRounds, showDetails }) });
            void logEvent('share_text', { rounds_shown: showRounds, details_shown: showDetails });
        } catch (error) {
            console.error('Failed to share text:', error);
        }
    };

    const preview = (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} testID="share-preview">
            <View ref={cardRef} collapsable={false} style={[styles.capture, { backgroundColor: theme.background }]}>
                <ShareCard
                    title={game.title}
                    details={describeGame(game)}
                    format={format}
                    rows={rows}
                    result={result}
                    showRounds={showRounds}
                    showDetails={showDetails}
                    minWidth={cardMinWidth}
                    theme={theme}
                />
            </View>
        </ScrollView>
    );

    const formatPicker = (
        <View style={[styles.segmented, { backgroundColor: theme.backgroundTertiary }]}>
                {FORMATS.map(([value, label]) => {
                    const selected = format === value;
                    return (
                        <TouchableOpacity
                            key={value}
                            testID={`share-format-${value}`}
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                            onPress={() => setFormat(value)}
                            style={[styles.segment, selected && { backgroundColor: theme.inputBackground }]}
                        >
                            <Text style={[styles.segmentLabel, { color: theme.text }, selected && styles.segmentLabelSelected]}>
                                {label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
        </View>
    );

    const editGame = () => navigation.navigate('EditGame', { source: 'share_screen' });

    // Two-pane layout: a settings-style list beside the preview.
    const options = (
        <View style={styles.options}>
            {formatPicker}
            <View style={[styles.group, { backgroundColor: theme.backgroundSecondary }]}>
                <View style={styles.groupRow}>
                    <Text style={[styles.groupLabel, { color: theme.text }]}>Round-by-round scores</Text>
                    <Switch testID="share-toggle-rounds" value={showRounds} onValueChange={setShowRounds}
                        ios_backgroundColor={theme.separator} />
                </View>
                <View style={[styles.separator, { backgroundColor: theme.separator }]} />
                <View style={styles.groupRow}>
                    <Text style={[styles.groupLabel, { color: theme.text }]}>Date and round count</Text>
                    <Switch testID="share-toggle-details" value={showDetails} onValueChange={setShowDetails}
                        ios_backgroundColor={theme.separator} />
                </View>
                <View style={[styles.separator, { backgroundColor: theme.separator }]} />
                <TouchableOpacity
                    style={styles.groupRow}
                    accessibilityRole="button"
                    onPress={editGame}
                >
                    <Text style={[styles.groupLabel, { color: theme.text }]}>Edit title & names</Text>
                    <Icon name="chevron-right" color={theme.textTertiary} />
                </TouchableOpacity>
            </View>
        </View>
    );

    const chip = (testID: string, label: string, icon: string, on: boolean | undefined, onPress: () => void) => (
        <TouchableOpacity
            testID={testID}
            accessibilityRole={on === undefined ? 'button' : 'checkbox'}
            accessibilityState={on === undefined ? undefined : { checked: on }}
            onPress={onPress}
            style={[styles.chip, { backgroundColor: on ? theme.tint : theme.backgroundSecondary }]}
        >
            <Icon name={icon} type="material" size={16} color={on ? '#FFFFFF' : theme.tint} />
            <Text style={[styles.chipLabel, { color: on ? '#FFFFFF' : theme.tint }]}>{label}</Text>
        </TouchableOpacity>
    );

    // Single pane: compact controls that stay above the preview, so a long
    // scoreboard never pushes them off screen.
    const compactOptions = (
        <View style={styles.compactOptions}>
            {formatPicker}
            <View style={styles.chips}>
                {chip('share-toggle-rounds', 'Rounds', showRounds ? 'check' : 'add', showRounds, () => setShowRounds(!showRounds))}
                {chip('share-toggle-details', 'Date', showDetails ? 'check' : 'add', showDetails, () => setShowDetails(!showDetails))}
                {chip('share-edit', 'Edit names', 'edit', undefined, editGame)}
            </View>
        </View>
    );

    const actions = (
        <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <TouchableOpacity
                style={[styles.button, styles.secondaryButton, { backgroundColor: theme.backgroundSecondary }]}
                accessibilityRole="button"
                onPress={shareText}
            >
                <Text style={[styles.buttonLabel, { color: theme.tint }]}>Share Text</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.button, styles.primaryButton, { backgroundColor: theme.tint }]}
                accessibilityRole="button"
                onPress={shareImage}
            >
                <Icon name="ios-share" type="material" size={20} color="#FFFFFF" />
                <Text style={[styles.buttonLabel, styles.primaryLabel]}>Share Image</Text>
            </TouchableOpacity>
        </View>
    );

    if (twoPane) {
        return (
            <View style={[styles.screen, styles.twoPane, {
                backgroundColor: theme.background,
                paddingLeft: insets.left,
                paddingRight: insets.right,
            }]}>
                <ScrollView style={{ width: paneWidth }} testID="share-screen-scroll"
                    contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
                    {options}
                </ScrollView>
                <View style={{ width: FOLD_GAP }} />
                <View style={{ width: paneWidth }}>
                    <ScrollView contentContainerStyle={styles.twoPanePreview}>{preview}</ScrollView>
                    {actions}
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.screen, {
            backgroundColor: theme.background,
            paddingLeft: insets.left,
            paddingRight: insets.right,
        }]}>
            {compactOptions}
            <ScrollView testID="share-screen-scroll"
                contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}>
                {preview}
            </ScrollView>
            <View style={[styles.floatingActions, { left: insets.left, right: insets.right, backgroundColor: theme.background }]}>
                {actions}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    flex: {
        flex: 1,
    },
    twoPane: {
        flexDirection: 'row',
    },
    twoPanePreview: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    capture: {
        padding: SIDE_PADDING,
    },
    card: {
        borderRadius: 18,
        padding: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    cardDetails: {
        fontSize: 13,
        marginTop: 3,
    },
    headline: {
        alignItems: 'center',
        borderRadius: 10,
        flexDirection: 'row',
        marginTop: 12,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    headlineDot: {
        borderRadius: 5,
        borderWidth: StyleSheet.hairlineWidth,
        height: 10,
        marginRight: 8,
        width: 10,
    },
    headlineText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
    },
    headlineMargin: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    table: {
        flexDirection: 'row',
        marginTop: 8,
    },
    th: {
        fontSize: 11,
        fontWeight: '500',
        paddingHorizontal: 6,
        paddingVertical: 6,
    },
    td: {
        alignItems: 'center',
        height: ROW_HEIGHT,
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    nameColumn: {
        flexGrow: 1,
    },
    nameCell: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'flex-start',
    },
    totalColumn: {
        minWidth: 52,
    },
    roundColumn: {
        minWidth: 34,
    },
    rank: {
        fontSize: 14,
        fontVariant: ['tabular-nums'],
        minWidth: 18,
    },
    colorBar: {
        borderRadius: 2,
        borderWidth: StyleSheet.hairlineWidth,
        height: 16,
        marginRight: 8,
        width: 4,
    },
    name: {
        fontSize: 15,
        maxWidth: 160,
    },
    crown: {
        color: '#D9A400',
        fontSize: 13,
    },
    total: {
        fontSize: 15,
        fontVariant: ['tabular-nums'],
        fontWeight: '700',
    },
    score: {
        fontSize: 15,
        fontVariant: ['tabular-nums'],
    },
    standings: {
        gap: 8,
        marginTop: 14,
    },
    standingRow: {
        alignItems: 'center',
        flexDirection: 'row',
    },
    standingRank: {
        fontSize: 14,
        width: 26,
    },
    standingTrack: {
        flex: 1,
    },
    standingBar: {
        alignItems: 'center',
        borderRadius: 9,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    standingName: {
        flexShrink: 1,
        fontSize: 15,
        fontWeight: '600',
    },
    standingTotal: {
        fontSize: 15,
        fontVariant: ['tabular-nums'],
        fontWeight: '700',
        marginLeft: 8,
    },
    winnerCard: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    winnerTitle: {
        fontSize: 15,
        fontWeight: '600',
        opacity: 0.9,
        textAlign: 'center',
    },
    winnerDetails: {
        fontSize: 12,
        marginTop: 2,
        opacity: 0.8,
    },
    winnerCrown: {
        color: '#FFD84A',
        fontSize: 40,
        marginTop: 16,
    },
    winnerName: {
        fontSize: 34,
        fontWeight: '800',
        textAlign: 'center',
    },
    winnerTotal: {
        fontSize: 72,
        fontVariant: ['tabular-nums'],
        fontWeight: '800',
    },
    winnerMargin: {
        fontSize: 14,
        opacity: 0.85,
    },
    winnerRest: {
        alignSelf: 'stretch',
        borderRadius: 12,
        marginTop: 20,
    },
    winnerRestRow: {
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    footer: {
        fontSize: 11,
        letterSpacing: 0.3,
        marginTop: 12,
        opacity: 0.8,
        textAlign: 'center',
    },
    options: {
        paddingHorizontal: SIDE_PADDING,
        paddingTop: 4,
    },
    segmented: {
        borderRadius: 9,
        flexDirection: 'row',
        gap: 2,
        padding: 2,
    },
    segment: {
        alignItems: 'center',
        borderRadius: 7,
        flex: 1,
        justifyContent: 'center',
        minHeight: 34,
    },
    segmentLabel: {
        fontSize: 15,
    },
    segmentLabelSelected: {
        fontWeight: '600',
    },
    group: {
        borderRadius: 12,
        marginTop: 16,
        paddingLeft: 16,
    },
    groupRow: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        minHeight: 48,
        paddingRight: 12,
    },
    groupLabel: {
        fontSize: 16,
    },
    compactOptions: {
        gap: 10,
        paddingHorizontal: SIDE_PADDING,
        paddingTop: 8,
    },
    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        alignItems: 'center',
        borderRadius: 16,
        flexDirection: 'row',
        gap: 4,
        minHeight: 32,
        paddingHorizontal: 12,
    },
    chipLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    separator: {
        height: StyleSheet.hairlineWidth,
    },
    floatingActions: {
        bottom: 0,
        position: 'absolute',
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: SIDE_PADDING,
        paddingTop: 12,
    },
    button: {
        alignItems: 'center',
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        minHeight: 52,
    },
    secondaryButton: {
        flex: 1,
    },
    primaryButton: {
        flex: 2,
        gap: 6,
    },
    buttonLabel: {
        fontSize: 17,
        fontWeight: '600',
    },
    primaryLabel: {
        color: '#FFFFFF',
    },
});

export default ShareScreen;
