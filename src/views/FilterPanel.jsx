import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  FormGroup,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Collapse,
  Typography,
  IconButton,
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { useRedmine } from './App';

const FilterPanel = () => {
  const { isLoading, handleApplyFilter } = useRedmine();
  const [filterConditions, setFilterConditions] = useState({
    status: [],
    createdFrom: '',
    createdTo: '',
    assignedTo: '',
    keyword: '',
  });
  const [statusOpen, setStatusOpen] = useState(true);

  const handleStatusChange = (event) => {
    const value = event.target.name;
    setFilterConditions((prev) => {
      const newStatus = prev.status.includes(value)
        ? prev.status.filter((s) => s !== value)
        : [...prev.status, value];
      return { ...prev, status: newStatus };
    });
  };

  const handleChange = (e) => {
    setFilterConditions({
      ...filterConditions,
      [e.target.name]: e.target.value,
    });
  };

  const handleApply = () => {
    handleApplyFilter(filterConditions);
  };

  const toggleStatusCollapse = () => {
    setStatusOpen(!statusOpen);
  };

  return (
    <Box
      p={3}
      sx={{
        border: '1px solid',
        borderColor: 'grey.300',
        borderRadius: 2,
        backgroundColor: 'background.paper',
        boxShadow: 1,
      }}
    >
      <Typography variant="h6" gutterBottom>
        Bộ lọc
      </Typography>
      <Grid container spacing={3}>
        {/* Assigned To */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Người được giao"
            name="assignedTo"
            value={filterConditions.assignedTo}
            onChange={handleChange}
            disabled={isLoading}
            variant="outlined"
            aria-label="Người được giao"
          />
        </Grid>

        {/* Keyword */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Từ khóa"
            name="keyword"
            value={filterConditions.keyword}
            onChange={handleChange}
            disabled={isLoading}
            variant="outlined"
            aria-label="Từ khóa tìm kiếm"
          />
        </Grid>

        {/* Created On Dates */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Từ ngày (created_on)"
            type="date"
            name="createdFrom"
            InputLabelProps={{ shrink: true }}
            value={filterConditions.createdFrom}
            onChange={handleChange}
            disabled={isLoading}
            variant="outlined"
            aria-label="Ngày tạo từ"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Đến ngày (created_on)"
            type="date"
            name="createdTo"
            InputLabelProps={{ shrink: true }}
            value={filterConditions.createdTo}
            onChange={handleChange}
            disabled={isLoading}
            variant="outlined"
            aria-label="Ngày tạo đến"
          />
        </Grid>

        {/* Status Section */}
        <Grid item xs={12}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{ cursor: 'pointer', mb: 1 }}
            onClick={toggleStatusCollapse}
          >
            <Typography variant="subtitle1">Trạng thái</Typography>
            <IconButton size="small">
              {statusOpen ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
          <Collapse in={statusOpen}>
            <FormGroup
              row
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'grey.200',
                borderRadius: 1,
                backgroundColor: 'grey.50',
              }}
            >
              {[
                '新規',
                '調査依頼',
                '調査中',
                '調査済',
                '修正依頼',
                '修正中',
                '再修正依頼',
                '検証依頼',
                '検証中',
                '検証済',
                '適用依頼',
                '完了',
              ].map((s) => (
                <FormControlLabel
                  key={s}
                  control={
                    <Checkbox
                      checked={filterConditions.status.includes(s)}
                      onChange={handleStatusChange}
                      name={s}
                      disabled={isLoading}
                    />
                  }
                  label={s}
                  sx={{ minWidth: 120 }}
                />
              ))}
            </FormGroup>
          </Collapse>
        </Grid>

        {/* Apply Button */}
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleApply}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
            sx={{ py: 1.5 }}
          >
            {isLoading ? 'Đang tải...' : 'Áp dụng bộ lọc'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FilterPanel;