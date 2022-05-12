import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { CardActions } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";

export default function ActionAreaCard({ post, deletePost, setEdit, isOwner }) {
  return (
    <Card sx={{ width: "100%" }}>
      <CardContent>
        <Typography gutterBottom variant="h5" component="div">
          {post.user.first_name} {post.user.last_name}
        </Typography>
        <Typography gutterBottom variant="h6" component="div">
          {new Date(post.created_at).toLocaleDateString("ru", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          dangerouslySetInnerHTML={{ __html: post.message }}
        />
      </CardContent>

      {isOwner && (
        <CardActions>
          <IconButton onClick={() => setEdit(post)} size="large">
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={() => deletePost(post._id)}
            size="large"
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </CardActions>
      )}
    </Card>
  );
}
