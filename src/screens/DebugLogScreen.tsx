import React, { useCallback, useState } from 'react';

import { Alert, FlatList, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { clearLogs, getLogs, LogEntry } from '../Logger';
import { useTheme } from '../theme';

type LevelFilter = Record<LogEntry['level'], boolean>;

const LEVELS: LogEntry['level'][] = ['log', 'info', 'warn', 'error'];

const LEVEL_COLORS: Record<LogEntry['level'], string> = {
    log: '#8e8e93',
    info: '#007aff',
    warn: '#ff9f0a',
    error: '#ff453a',
};

const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}.${d.getMilliseconds().toString().padStart(3, '0')}`;
};

const formatArgs = (args: unknown[]): string => {
    return args.map(a => {
        if (typeof a === 'string') return a;
        try { return JSON.stringify(a, null, 2); } catch { return String(a); }
    }).join(' ');
};

const LogRow = React.memo(({ item, theme }: { item: LogEntry; theme: ReturnType<typeof useTheme> }) => {
    const color = LEVEL_COLORS[item.level];

    return (
        <TouchableOpacity
            onPress={() => Alert.alert('Log Entry', formatArgs(item.args), [
                { text: 'Copy', onPress: () => Share.share({ message: formatArgs(item.args) }) },
                { text: 'Close', style: 'cancel' },
            ])}
            style={[
                styles.logRow,
            ]}
        >
            <View style={styles.logRowHeader}>
                <Text style={[styles.logLevel, { color }]}>{item.level.toUpperCase()}</Text>
                <Text style={[styles.logTime, { color: theme.textTertiary }]}>{formatTime(item.timestamp)}</Text>
            </View>
            <Text style={[styles.logMessage, { color: theme.text }]} numberOfLines={8}>
                {formatArgs(item.args)}
            </Text>
        </TouchableOpacity>
    );
});

const DebugLogScreen: React.FunctionComponent = () => {
    const theme = useTheme();
    const [filter, setFilter] = useState<LevelFilter>({ log: false, info: true, warn: true, error: true });
    const [logs, setLogs] = useState(() => [...getLogs()]);

    const refresh = useCallback(() => {
        setLogs([...getLogs()]);
    }, []);

    const toggleFilter = (level: LogEntry['level']) => {
        setFilter(prev => ({ ...prev, [level]: !prev[level] }));
    };

    const filtered = logs.filter(e => filter[e.level]).reverse();

    const handleClear = () => {
        clearLogs();
        setLogs([]);
    };

    const anyOn = Object.values(filter).some(Boolean);

    const handleShareAll = () => {
        const text = filtered.map(e =>
            `[${e.level.toUpperCase()}] ${formatTime(e.timestamp)} ${formatArgs(e.args)}`
        ).join('\n');
        Share.share({ message: text });
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.separator }]}>
                <View style={styles.filterRow}>
                    {LEVELS.map(level => (
                        <TouchableOpacity
                            key={level}
                            onPress={() => toggleFilter(level)}
                            style={[
                                styles.filterChip,
                                { backgroundColor: filter[level] ? LEVEL_COLORS[level] : theme.separator },
                            ]}
                        >
                            <Text style={[styles.filterChipText, { color: filter[level] ? '#fff' : theme.textTertiary }]}>
                                {level.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity onPress={refresh} style={[styles.filterChip, { backgroundColor: theme.separator }]}>
                        <Text style={[styles.filterChipText, { color: theme.tint }]}>↻</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleClear} style={[styles.filterChip, { backgroundColor: theme.separator }]}>
                        <Text style={[styles.filterChipText, { color: theme.destructive }]}>✕</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleShareAll} style={[styles.filterChip, { backgroundColor: theme.separator }]}>
                        <Text style={[styles.filterChipText, { color: theme.tint }]}>⎘</Text>
                    </TouchableOpacity>
                </View>
                <Text style={[styles.logCount, { color: theme.textTertiary }]}>
                    {filtered.length} / {logs.length} logs
                </Text>
            </View>
            {anyOn ? (
                <FlatList
                    data={filtered}
                    keyExtractor={(_, i) => String(i)}
                    renderItem={({ item }) => <LogRow item={item} theme={theme} />}
                    initialNumToRender={30}
                    maxToRenderPerBatch={20}
                />
            ) : (
                <View style={styles.empty}>
                    <Text style={{ color: theme.textTertiary, fontSize: 16 }}>No logs match the current filter.</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
    },
    filterChip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '600',
    },
    logCount: {
        fontSize: 11,
        marginTop: 4,
    },
    logRow: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#333',
    },
    logRowHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 2,
    },
    logLevel: {
        fontSize: 11,
        fontWeight: '700',
        width: 44,
    },
    logTime: {
        fontSize: 10,
        fontFamily: 'Menlo',
    },
    logMessage: {
        fontSize: 11,
        fontFamily: 'Menlo',
        lineHeight: 15,
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default DebugLogScreen;
