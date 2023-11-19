import { Text } from "react-native";
import { useAppSelector } from "../../redux/hooks";
import { selectPlayerById } from "../../redux/PlayersSlice";

interface Props {
    playerId: string;
    last?: boolean;
}

const GameListItemPlayerName: React.FunctionComponent<Props> = ({ playerId, last = false }) => {

    const playerName = useAppSelector(state => selectPlayerById(state, playerId)?.playerName);

    return (
        <Text>{playerName}{!last && ', '}</Text>
    );
};

export default GameListItemPlayerName;
