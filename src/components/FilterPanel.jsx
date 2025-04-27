import React, { useState } from "react";
import { Box, TextField, Button, Grid } from "@mui/material";

const FilterPanel = ({ onFilter }) => {
  const [filterConditions, setFilterConditions] = useState({
    status: "",
    keyword: "",
  });

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
        <Grid item xs={4}>
          <TextField
            fullWidth
            label="Trạng thái"
            name="status"
            value={filterConditions.status}
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