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
  });

  const [statusOpen, setStatusOpen] = useState(true);
  const [statusAllChecked, setStatusAllChecked] = useState(false);
  const [filterOpen, setFilterOpen] = useState(true);

  const allStatuses = [
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
  ];

  const handleStatusChange = (event) => {
    const value = event.target.name;
    setFilterConditions((prev) => {
      const newStatus = prev.status.includes(value)
        ? prev.status.filter((s) => s !== value)
        : [...prev.status, value];
      setStatusAllChecked(newStatus.length === allStatuses.length);
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Bộ lọc</Typography>
        <IconButton onClick={() => setFilterOpen(!filterOpen)}>
          {filterOpen ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>
      <Collapse in={filterOpen}>
        <Grid container spacing={3}>
          {/* Assigned To */}
          <Grid item xs={12} sm={6}>
            <FormGroup row>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filterConditions.assignedTo === 'all'}
                    onChange={() =>
                      setFilterConditions({ ...filterConditions, assignedTo: 'all' })
                    }
                    disabled={isLoading}
                  />
                }
                label="All"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filterConditions.assignedTo === 'fjs'}
                    onChange={() =>
                      setFilterConditions({ ...filterConditions, assignedTo: 'fjs' })
                    }
                    disabled={isLoading}
                  />
                }
                label="FJS only"
              />
            </FormGroup>
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
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={statusAllChecked}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setStatusAllChecked(checked);
                        setFilterConditions((prev) => ({
                          ...prev,
                          status: checked
                            ? [
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
                              ]
                            : [],
                        }));
                      }}
                      disabled={isLoading}
                    />
                  }
                  label="All"
                  sx={{ minWidth: 120 }}
                />
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
      </Collapse>
    </Box>
  );
};

export default FilterPanel;