import * as React from 'react';
import Typography from '@mui/material/Typography';
import { Box, Paper } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';

export default function ActionAreaCard({ post, deletePost, setEdit, isOwner }) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwner ? 'flex-end' : 'flex-start',
      }}
      style={{
        maxWidth: '100vw',
      }}
      className="post"
    >
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          backgroundColor: isOwner ? 'secondary.light' : 'primary.light',
          borderRadius: isOwner ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
        }}
      >
        <Typography gutterBottom component="div">
          {post.user?.first_name} {post.user?.last_name}
        </Typography>
        <Typography
          variant="body1"
          style={{
            whiteSpace: 'pre-line',
          }}
        >
          {post.message}
        </Typography>

        {isOwner && (
          <span
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <IconButton onClick={() => setEdit(post)} size="small">
              <EditIcon />
            </IconButton>
            <IconButton
              onClick={() => deletePost(post._id)}
              size="small"
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </span>
        )}
      </Paper>
    </Box>
  );
}
