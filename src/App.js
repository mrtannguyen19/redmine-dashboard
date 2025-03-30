import React, { useState } from 'react';
import { Container, Typography, Grid, Card, CardContent, FormControlLabel, Checkbox, Box, Accordion, AccordionSummary, AccordionDetails, TextField } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; // Thêm import này
import RedmineModel from './models/RedmineModel';
import RedmineController from './controllers/RedmineController';
import ProjectChart from './views/Charts/ProjectChart';
import DueDateChart from './views/Charts/DueDateChart';
import PriorityChart from './views/Charts/PriorityChart';
import ProjectFjnErrorChart from './views/Charts/ProjectFjnErrorChart';
import IssueTable from './views/IssueTable';
import ChartToggle from './views/ChartToggle';

function App() {
  const [startDate, setStartDate] = useState(''); // State cho ngày bắt đầu
  const [endDate, setEndDate] = useState('');     // State cho ngày kết thúc
  const model = RedmineModel(apiKeysFile, startDate, endDate); // Truyền thêm startDate, endDate
  const [apiKeysFile, setApiKeysFile] = useState(null); // State để lưu file
  const controller = RedmineController(model);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setApiKeysFile(file);
  };

  if (model.loading) {
    return (
      <Container maxWidth="lg" sx={{ textAlign: 'center', mt: 5 }}>
        <Typography variant="h6" color="textSecondary">Đang tải dữ liệu...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Redmine Dashboard
      </Typography>
      <Box sx={{ mb: 3 }}>
        <input type="file" accept=".xml" onChange={handleFileChange} />
        {apiKeysFile && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Đã chọn file: {apiKeysFile.name}
          </Typography>
        )}
      </Box>
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          label="Ngày bắt đầu"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Ngày kết thúc"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#555' }}>
        Thống Kê (Tổng: {model.nearDueIssues.length} issues)
      </Typography>

      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={<Checkbox checked={model.showAllCharts} onChange={controller.handleToggleAllCharts} />}
          label="Hiển thị tất cả biểu đồ"
          sx={{ '& .MuiFormControlLabel-label': { fontWeight: 'bold' } }}
        />
      </Box>

      {model.showAllCharts && (
        <Accordion defaultExpanded sx={{ mb: 4, boxShadow: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ color: '#1976d2' }}>Biểu Đồ Thống Kê</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <ChartToggle showCharts={model.showCharts} onToggle={controller.handleChartToggle} />
            <Grid container spacing={3}>
              {model.showCharts.project && (
                <Grid item xs={12} md={6}>
                  <ProjectChart data={model.projectData} onClick={controller.handleProjectClick} />
                </Grid>
              )}
              {model.showCharts.dueDate && (
                <Grid item xs={12} md={6}>
                  <DueDateChart data={model.dueDateData} onClick={controller.handleDueDateClick} />
                </Grid>
              )}
              {model.showCharts.projectFjnError && (
                <Grid item xs={12} md={6}>
                  <ProjectFjnErrorChart data={model.projectFjnErrorData} onClick={controller.handleProjectFjnErrorClick} />
                </Grid>
              )}
              {model.showCharts.priority && (
                <Grid item xs={12} md={6}>
                  <PriorityChart data={model.priorityData} onClick={controller.handlePriorityClick} />
                </Grid>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      <Card sx={{ boxShadow: 3 }}>
        <CardContent>
          <IssueTable
            issues={model.filteredIssues}
            selectedFilter={model.selectedFilter}
            onShowAll={controller.handleShowAll}
            onRefresh={controller.handleRefresh}
            filters={model.filters}
            onFilterChange={controller.handleFilterChange}
            onSort={controller.handleSort}
          />
        </CardContent>
      </Card>
    </Container>
  );
}

export default App;