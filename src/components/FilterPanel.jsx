import React, { useState } from "react";
import { Box, TextField, Button, Grid } from "@mui/material";
import { FormGroup, FormControlLabel, Checkbox } from "@mui/material";

const FilterPanel = ({ onFilter }) => {
  const [filterConditions, setFilterConditions] = useState({
    status: [],
    createdFrom: "",
    createdTo: "",
    keyword: "",
  });

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
    onFilter(filterConditions);
  };

  return (
    <Box p={2}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormGroup row>
          {[
            "新規", "調査依頼", "調査中", "調査済", "修正依頼",
            "修正中", "再修正依頼", "検証依頼", "検証中",
            "検証済", "適用依頼", "完了"
          ].map((s) => (
            <FormControlLabel
              key={s}
              control={
                <Checkbox
                  checked={filterConditions.status.includes(s)}
                  onChange={handleStatusChange}
                  name={s}
                />
              }
              label={s}
            />
          ))}
          </FormGroup>
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Từ ngày (created_on)"
            type="date"
            name="createdFrom"
            InputLabelProps={{ shrink: true }}
            value={filterConditions.createdFrom}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Đến ngày (created_on)"
            type="date"
            name="createdTo"
            InputLabelProps={{ shrink: true }}
            value={filterConditions.createdTo}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            fullWidth
            label="Từ khoá"
            name="keyword"
            value={filterConditions.keyword}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={4}>
          <Button variant="contained" fullWidth onClick={handleApply}>
            Áp dụng
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FilterPanel;