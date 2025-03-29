import React from 'react';
import { Grid, FormControlLabel, Checkbox, Box } from '@mui/material';

const ChartToggle = ({ showCharts, onToggle }) => (
  <Box sx={{ mb: 2 }}>
    <Grid container spacing={1}>
      <Grid item>
        <FormControlLabel
          control={<Checkbox checked={showCharts.project} onChange={() => onToggle('project')} />}
          label="プロジェクトごとの課題数"
        />
      </Grid>
      <Grid item>
        <FormControlLabel
          control={<Checkbox checked={showCharts.dueDate} onChange={() => onToggle('dueDate')} />}
          label="回答納期ごとの課題数"
        />
      </Grid>
      <Grid item>
        <FormControlLabel
          control={<Checkbox checked={showCharts.priority} onChange={() => onToggle('priority')} />}
          label="優先度ごとの課題数"
        />
      </Grid>
      <Grid item>
        <FormControlLabel
          control={<Checkbox checked={showCharts.projectFjnError} onChange={() => onToggle('projectFjnError')} />}
          label="プロジェクトごとFJN側障害種別"
        />
      </Grid>
    </Grid>
  </Box>
);

export default ChartToggle;