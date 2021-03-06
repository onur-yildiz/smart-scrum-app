import { newIssue, switchIssue } from "../store/scrumSlice";
import { useAppDispatch, useAppSelector } from "../hooks";

import Button from "@mui/material/Button/Button";
import Card from "@mui/material/Card/Card";
import CardActions from "@mui/material/CardActions/CardActions";
import CardContent from "@mui/material/CardContent/CardContent";
import Container from "@mui/material/Container";
import HubContext from "../store/hubContext";
import Typography from "@mui/material/Typography/Typography";
import { useContext } from "react";
import { v4 } from "uuid";

const IssueBox = () => {
  const hub = useContext(HubContext);
  const dispatch = useAppDispatch();
  const [issueTitle, issueDesc, issueIndex, isOwner, issuesLength, userId] =
    useAppSelector((state) => {
      const room = state.scrum.room;
      const issue = room.issues[room.issueIndex];
      return [
        issue.title,
        issue.description,
        room.issueIndex,
        state.scrum.isOwner,
        room.issues.length,
        state.scrum.user.id,
      ];
    });

  const handleIssueSwitch = (next: boolean) => {
    dispatch(
      switchIssue({
        value: issueIndex + (next ? 1 : -1),
        connection: hub.connection,
      })
    );
  };

  const handleAutoCreate = () => {
    dispatch(
      newIssue({
        value: {
          id: v4(),
          creatorId: userId,
          title: `Issue ${issuesLength + 1}`,
          description: "No description provided.",
          rounds: [{ votes: [] }],
        },
        connection: hub.connection,
      })
    );
    handleIssueSwitch(true);
  };

  return (
    <Container maxWidth="lg">
      <Card variant="outlined">
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            {issueTitle}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxHeight: "50vh", overflow: "auto" }}
          >
            {issueDesc}
          </Typography>
        </CardContent>
        {isOwner && (
          <CardActions>
            {/* // TODO: edit issue */}
            <Button
              onClick={() => handleIssueSwitch(false)}
              sx={{ marginRight: "auto" }}
              size="large"
              disabled={issueIndex === 0}
            >
              Previous
            </Button>
            {issueIndex !== issuesLength - 1 ? (
              <Button
                onClick={() => handleIssueSwitch(true)}
                size="large"
                disabled={issueIndex === issuesLength - 1}
              >
                Next
              </Button>
            ) : (
              <Button onClick={handleAutoCreate} size="large">
                Auto Create
              </Button>
            )}
          </CardActions>
        )}
      </Card>
    </Container>
  );
};

export default IssueBox;
