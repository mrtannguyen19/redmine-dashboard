import React, { useState, useMemo, useCallback, useEffect } from 'react';
   import { RevoGrid } from '@revolist/react-datagrid';
   import { Box, Typography } from '@mui/material';
   //import '../../assets/revo-grid.css'; // Copied CSS
   import './IssueTable.css';

   const IssueTable = ({ rows, onRowSelect }) => {
     // Log rows for debugging
     console.log('Rows received:', rows);

     // Selection state
     const [selectedRows, setSelectedRows] = useState([]);

     // Handle row selection
     const handleRowSelection = useCallback((e) => {
       const selected = e.detail.map((index) => rows[index]);
       setSelectedRows(selected);
       console.log('Selected rows:', selected);
       if (onRowSelect) {
         onRowSelect(selected);
       }
     }, [rows, onRowSelect]);

     // Define columns
     const columns = useMemo(() => [
       { prop: 'id', name: '番号', size: 80, sortable: true },
       { prop: 'issueId', name: '課題ID', size: 100, sortable: true },
       { prop: 'projectName', name: 'プロジェクト名', size: 150, sortable: true },
       { prop: 'statusName', name: 'ステータス', size: 120, sortable: true },
       { prop: 'dueDate', name: '希望納期', size: 120, sortable: true },
       { prop: 'answerDate', name: '回答納期', size: 120, sortable: true },
       { prop: 'subject', name: '件名', size: 300, sortable: true },
       { prop: 'ucdType', name: 'UCD側障害種別', size: 150, sortable: true },
       { prop: 'fjnType', name: 'FJN側障害種別', size: 150, sortable: true },
       { prop: 'pgid', name: '発生PGID', size: 120, sortable: true },
       { prop: 'author', name: '作成者', size: 120, sortable: true },
       { prop: 'assignedTo', name: '担当者', size: 120, sortable: true },
       { prop: 'fixPgid', name: '修正PGID', size: 120, sortable: true },
       { prop: 'partId', name: '部品ID', size: 120, sortable: true },
     ], []);

     // Transform rows to RevoGrid data format
     const source = useMemo(() => {
       if (!rows || !Array.isArray(rows)) {
         console.warn('Invalid rows data:', rows);
         return [];
       }
       const transformed = rows.map((issue) => ({
         id: issue.id,
         issueId: issue.id,
         projectName: issue.project?.name || 'Unknown',
         statusName: issue.status?.name || 'N/A',
         dueDate: issue.due_date ? issue.due_date : 'N/A',
         answerDate: issue.custom_fields?.find((field) => field.name === '回答納期')?.value || 'N/A',
         subject: issue.subject || 'N/A',
         ucdType: issue.custom_fields?.find((field) => field.name === 'UCD側障害種別')?.value || 'N/A',
         fjnType: issue.custom_fields?.find((field) => field.name === 'FJN側障害種別')?.value || 'N/A',
         pgid: issue.custom_fields?.find((field) => field.name === '発生PGID')?.value || 'N/A',
         author: issue.author?.name || 'Unknown',
         assignedTo: issue.assigned_to?.name || 'Unassigned',
         fixPgid: issue.custom_fields?.find((field) => field.name === '修正PGID')?.value || 'N/A',
         partId: issue.custom_fields?.find((field) => field.name === '部品ID')?.value || 'N/A',
       }));
       console.log('Transformed source:', transformed);
       return transformed;
     }, [rows]);

     // Render fallback if no data
     if (!source.length) {
       return (
         <Box p={2} sx={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <Typography variant="h6" color="text.secondary">
             No data available
           </Typography>
         </Box>
       );
     }

     return (
       <Box p={2} sx={{ height: '500px', border: '1px solid #e0e0e0', backgroundColor: '#fff', color: '#000' }}>
         <RevoGrid
           columns={columns}
           source={source}
           theme="material"
           autoSizeColumn={true}
           resize={true}
           pagination={true}
           paginationSizes={[10, 20, 50]}
           rowSelection={true}
           style={{ height: '100%', width: '100%', color: '#000', backgroundColor: '#fff' }}
           onRowSelection={handleRowSelection}
           onAfterEdit={(e) => console.log('Edit event:', e.detail)}
           onBeforeRowRender={(e) => console.log('Row render event:', e.detail)}
           onBeforeSort={(e) => console.log('Sort event:', e.detail)}
         />
       </Box>
     );
   };

   export default IssueTable;