import React, { useState } from 'react';
import { Typography, Grid, Table, TableBody, TableCell, TableHead, TableRow, Button, TextField, TablePagination, Tooltip, Box } from '@mui/material'; // Thêm Box vào import
import { getCustomFieldValue } from '../utils/helpers';

const IssueTable = ({ issues, selectedFilter, onShowAll, onRefresh, filters, onFilterChange, onSort }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleTicketClick = (url) => {
    window.open(url, '_blank');
  };

  const safeIssues = Array.isArray(issues) ? issues : [];

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <>
      <Typography variant="h6" gutterBottom sx={{ color: '#1976d2' }}>
        Danh Sách Ticket
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Issue Sắp Đến Hạn {selectedFilter ? `(${selectedFilter.type === 'project' ? 'Dự án' : selectedFilter.type === 'dueDate' ? 'Ngày giao hàng' : selectedFilter.type === 'priority' ? 'Ưu tiên' : 'Dự án & Loại lỗi FJN'}: ${selectedFilter.value})` : '(Tất cả)'} - Tổng: {safeIssues.length} issues
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Button variant="contained" onClick={onShowAll} sx={{ mr: 1 }}>Hiển thị tất cả</Button>
            <Button variant="contained" onClick={onRefresh}>Làm mới</Button>
          </Box>
          <Table sx={{ minWidth: 650 }} size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell onClick={() => onSort('stt')} sx={{ fontWeight: 'bold', cursor: 'pointer' }}>番号</TableCell>
                <TableCell onClick={() => onSort('ticketNo')} sx={{ fontWeight: 'bold', cursor: 'pointer' }}>チケット番号</TableCell>
                <TableCell onClick={() => onSort('generatedPgId')} sx={{ fontWeight: 'bold', cursor: 'pointer' }}>発生PGID</TableCell>
                <TableCell onClick={() => onSort('projectName')} sx={{ fontWeight: 'bold', cursor: 'pointer' }}>プロジェクト名</TableCell>
                <TableCell onClick={() => onSort('author')} sx={{ fontWeight: 'bold', cursor: 'pointer' }}>作成者</TableCell>
                <TableCell onClick={() => onSort('desiredDeliveryDate')} sx={{ fontWeight: 'bold', cursor: 'pointer' }}>希望納期</TableCell>
                <TableCell onClick={() => onSort('responseDeliveryDate')} sx={{ fontWeight: 'bold', cursor: 'pointer' }}>回答納期</TableCell>
                <TableCell onClick={() => onSort('fjnErrorType')} sx={{ fontWeight: 'bold', cursor: 'pointer' }}>FJN側障害種別</TableCell>
                <TableCell onClick={() => onSort('ucdErrorType')} sx={{ fontWeight: 'bold', cursor: 'pointer' }}>UCD側障害種別</TableCell>
                <TableCell onClick={() => onSort('unitId')} sx={{ fontWeight: 'bold', cursor: 'pointer' }}>部品ID</TableCell>
                <TableCell onClick={() => onSort('editPgId')} sx={{ fontWeight: 'bold', cursor: 'pointer' }}>修正PGID</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><TextField value={filters.stt} onChange={(e) => onFilterChange(e, 'stt')} size="small" fullWidth /></TableCell>
                <TableCell><TextField value={filters.ticketNo} onChange={(e) => onFilterChange(e, 'ticketNo')} size="small" fullWidth /></TableCell>
                <TableCell><TextField value={filters.generatedPgId} onChange={(e) => onFilterChange(e, 'generatedPgId')} size="small" fullWidth /></TableCell>
                <TableCell><TextField value={filters.projectName} onChange={(e) => onFilterChange(e, 'projectName')} size="small" fullWidth /></TableCell>
                <TableCell><TextField value={filters.author} onChange={(e) => onFilterChange(e, 'author')} size="small" fullWidth /></TableCell>
                <TableCell><TextField value={filters.desiredDeliveryDate} onChange={(e) => onFilterChange(e, 'desiredDeliveryDate')} size="small" fullWidth /></TableCell>
                <TableCell><TextField value={filters.responseDeliveryDate} onChange={(e) => onFilterChange(e, 'responseDeliveryDate')} size="small" fullWidth /></TableCell>
                <TableCell><TextField value={filters.fjnErrorType} onChange={(e) => onFilterChange(e, 'fjnErrorType')} size="small" fullWidth /></TableCell>
                <TableCell><TextField value={filters.ucdErrorType} onChange={(e) => onFilterChange(e, 'ucdErrorType')} size="small" fullWidth /></TableCell>
                <TableCell><TextField value={filters.unitId} onChange={(e) => onFilterChange(e, 'unitId')} size="small" fullWidth /></TableCell>
                <TableCell><TextField value={filters.editPgId} onChange={(e) => onFilterChange(e, 'editPgId')} size="small" fullWidth /></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {safeIssues.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((issue, index) => (
                <TableRow key={issue.id} hover>
                  <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell>
                    <Tooltip title="Mở ticket trên Redmine">
                      <Typography 
                        onClick={() => handleTicketClick(issue.redmineUrl)} 
                        sx={{ cursor: 'pointer', color: '#1976d2', textDecoration: 'underline' }}
                      >
                        {issue.id}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{getCustomFieldValue(issue.custom_fields, '発生PGID')}</TableCell>
                  <TableCell>{issue.project.name}</TableCell>
                  <TableCell>{issue.author?.name || 'N/A'}</TableCell>
                  <TableCell>{getCustomFieldValue(issue.custom_fields, '希望納期')}</TableCell>
                  <TableCell>{getCustomFieldValue(issue.custom_fields, '回答納期')}</TableCell>
                  <TableCell>{getCustomFieldValue(issue.custom_fields, 'FJN側障害種別')}</TableCell>
                  <TableCell>{getCustomFieldValue(issue.custom_fields, 'UCD側障害種別')}</TableCell>
                  <TableCell>{getCustomFieldValue(issue.custom_fields, '部品ID')}</TableCell>
                  <TableCell>{getCustomFieldValue(issue.custom_fields, '修正PGID')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={safeIssues.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default IssueTable;