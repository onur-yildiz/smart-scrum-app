import {
  HttpTransportType,
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import {
  assignUserToIssue,
  changeUserName,
  designateOwner,
  joinRoom,
  loadRoom,
  newIssue,
  newMember,
  newVote,
  nextRound,
  removeIssue,
  removeUser,
  revealResult,
  setConsensusThreshold,
  setScoreList,
  switchIssue,
} from "./scrumSlice";
import { createContext, useEffect, useState } from "react";

import { useAppDispatch } from "../hooks";
import { useNavigate } from "react-router-dom";

export enum HubMethods {
  RECEIVE_MEMBER = "ReceiveMember",
  RECEIVE_ISSUE = "ReceiveIssue",
  RECEIVE_VOTE = "ReceiveVote",
  RECEIVE_SCORE_LIST = "ReceiveScoreList",
  RECEIVE_ROOM_ACCEPTION = "ReceiveRoomAcception",
  RECEIVE_USER_LEFT = "ReceiveUserLeft",
  RECEIVE_RESULT_REVEALED = "ReceiveResultRevealed",
  RECEIVE_NEXT_ROUND = "ReceiveNextRound",
  RECEIVE_ISSUE_SWITCH = "ReceiveIssueSwitch",
  RECEIVE_ISSUE_REMOVAL = "ReceiveIssueRemoval",
  RECEIVE_OWNER_DESIGNATION = "ReceiveOwnerDesignation",
  RECEIVE_CONSENSUS_THRESHOLD = "ReceiveConsensusThreshold",
  RECEIVE_ASSIGNEE = "ReceiveAssignee",
  RECEIVE_NAME_CHANGE = "ReceiveNameChange",
  // RECEIVE_MESSAGE = "ReceiveMessage",
}

const buildConnection = () =>
  new HubConnectionBuilder()
    .withUrl(process.env.REACT_APP_HUB_URL as string, {
      skipNegotiation: true,
      transport: HttpTransportType.WebSockets,
    })
    .configureLogging(LogLevel.Information)
    .build();

interface HubContextProps {
  connection: HubConnection;
  isConnected: boolean;
}

const initialState: HubContextProps = {
  connection: buildConnection(),
  isConnected: false,
};

const HubContext = createContext<HubContextProps>(initialState);

let isListening = false;
export const HubContextProdiver = (props: any) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const connection = initialState.connection;
  const [isConnected, setIsConnected] = useState(initialState.isConnected);

  useEffect(() => {
    if (isListening) return;
    const c = connection;
    c.on(HubMethods.RECEIVE_MEMBER, (user: User) => {
      console.debug("New member ", user);
      dispatch(newMember(user));
    });
    c.on(HubMethods.RECEIVE_ISSUE, (issue: Issue) => {
      console.debug("Received issue ", issue);
      dispatch(newIssue({ value: issue }));
    });
    c.on(HubMethods.RECEIVE_VOTE, (vote: Vote) => {
      console.debug("Received vote ", vote);
      dispatch(newVote(vote));
    });
    c.on(HubMethods.RECEIVE_SCORE_LIST, (scoreList: number[]) => {
      console.debug("Received score list ", scoreList);
      dispatch(setScoreList({ value: scoreList }));
    });
    c.on(HubMethods.RECEIVE_ROOM_ACCEPTION, (room: Room) => {
      console.debug("Accepted in ", room);
      dispatch(loadRoom(room));
      navigate(`/${room.id}`);
    });
    c.on(HubMethods.RECEIVE_USER_LEFT, (userId: string) => {
      console.debug("User left ", userId);
      dispatch(removeUser(userId));
    });
    c.on(HubMethods.RECEIVE_RESULT_REVEALED, () => {
      console.debug("Result revealed");
      dispatch(revealResult(null));
    });
    c.on(HubMethods.RECEIVE_ISSUE_SWITCH, (issueIndex: number) => {
      console.debug("Issue switched ", issueIndex);
      dispatch(switchIssue({ value: issueIndex }));
    });
    c.on(HubMethods.RECEIVE_OWNER_DESIGNATION, (ownerId: string) => {
      console.debug("Owner designation");
      dispatch(designateOwner(ownerId));
    });
    c.on(HubMethods.RECEIVE_NEXT_ROUND, () => {
      console.debug("Next round");
      dispatch(nextRound(null));
    });
    c.on(HubMethods.RECEIVE_CONSENSUS_THRESHOLD, (threshold: number) => {
      console.debug("Consensus threshold ", threshold);
      dispatch(setConsensusThreshold({ value: threshold }));
    });
    c.on(HubMethods.RECEIVE_ASSIGNEE, (issueId: string, assigneeId: string) => {
      console.debug("Assignee ", issueId, assigneeId);
      dispatch(assignUserToIssue({ issueId, assigneeId }));
    });
    c.on(HubMethods.RECEIVE_NAME_CHANGE, (userId: string, name: string) => {
      console.debug("Name change ", userId, name);
      dispatch(changeUserName({ userId, name }));
    });
    c.on(HubMethods.RECEIVE_ISSUE_REMOVAL, (issueId: string) => {
      console.debug("Issue removal ", issueId);
      dispatch(removeIssue({ value: issueId }));
    });
    isListening = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const start = async () => {
      if (connection.state !== HubConnectionState.Disconnected) return;
      try {
        await connection.start();
        setIsConnected(true);
        console.log("SignalR Connected.");
      } catch (err) {
        console.log(err);
        setTimeout(start, 3000);
      } finally {
        connection.onclose(async () => {
          setIsConnected(false);
          await start();
          connection.on("Connected", () => {
            setIsConnected(true);
            dispatch(joinRoom({ value: undefined, connection }));
            connection.off("Connected");
          });
        });
      }
    };

    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <HubContext.Provider value={{ connection, isConnected }}>
      {props.children}
    </HubContext.Provider>
  );
};

export default HubContext;
