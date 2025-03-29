import { getCustomFieldValue } from '../utils/helpers';

const RedmineController = (model) => {
  const applyFiltersAndSort = (issues, filterValues = model.filters, sort = model.sortConfig) => {
    let result = [...issues];
    result = result.filter((issue, index) => {
      const stt = (index + 1).toString();
      const ticketNo = issue.id.toString();
      const generatedPgId = getCustomFieldValue(issue.custom_fields, '発生PGID');
      const projectName = issue.project.name || '';
      const author = issue.author?.name || 'N/A';
      const desiredDeliveryDate = getCustomFieldValue(issue.custom_fields, '希望納期');
      const responseDeliveryDate = getCustomFieldValue(issue.custom_fields, '回答納期');
      const fjnErrorType = getCustomFieldValue(issue.custom_fields, 'FJN側障害種別');
      const ucdErrorType = getCustomFieldValue(issue.custom_fields, 'UCD側障害種別');
      const unitId = getCustomFieldValue(issue.custom_fields, '部品ID');
      const editPgId = getCustomFieldValue(issue.custom_fields, '修正PGID');

      return (
        stt.includes(filterValues.stt) &&
        ticketNo.includes(filterValues.ticketNo) &&
        generatedPgId.toLowerCase().includes(filterValues.generatedPgId.toLowerCase()) &&
        projectName.toLowerCase().includes(filterValues.projectName.toLowerCase()) &&
        author.toLowerCase().includes(filterValues.author.toLowerCase()) &&
        desiredDeliveryDate.toLowerCase().includes(filterValues.desiredDeliveryDate.toLowerCase()) &&
        responseDeliveryDate.toLowerCase().includes(filterValues.responseDeliveryDate.toLowerCase()) &&
        fjnErrorType.toLowerCase().includes(filterValues.fjnErrorType.toLowerCase()) &&
        ucdErrorType.toLowerCase().includes(filterValues.ucdErrorType.toLowerCase()) &&
        unitId.toLowerCase().includes(filterValues.unitId.toLowerCase()) &&
        editPgId.toLowerCase().includes(filterValues.editPgId.toLowerCase())
      );
    });

    if (sort.key) {
      result.sort((a, b) => {
        let aValue, bValue;
        switch (sort.key) {
          case 'stt': aValue = result.indexOf(a) + 1; bValue = result.indexOf(b) + 1; break;
          case 'ticketNo': aValue = a.id; bValue = b.id; break;
          case 'generatedPgId': aValue = getCustomFieldValue(a.custom_fields, '発生PGID'); bValue = getCustomFieldValue(b.custom_fields, '発生PGID'); break;
          case 'projectName': aValue = a.project.name || ''; bValue = b.project.name || ''; break;
          case 'author': aValue = a.author?.name || 'N/A'; bValue = b.author?.name || 'N/A'; break;
          case 'desiredDeliveryDate': aValue = getCustomFieldValue(a.custom_fields, '希望納期'); bValue = getCustomFieldValue(b.custom_fields, '希望納期'); break;
          case 'responseDeliveryDate': aValue = getCustomFieldValue(a.custom_fields, '回答納期'); bValue = getCustomFieldValue(b.custom_fields, '回答納期'); break;
          case 'fjnErrorType': aValue = getCustomFieldValue(a.custom_fields, 'FJN側障害種別'); bValue = getCustomFieldValue(b.custom_fields, 'FJN側障害種別'); break;
          case 'ucdErrorType': aValue = getCustomFieldValue(a.custom_fields, 'UCD側障害種別'); bValue = getCustomFieldValue(b.custom_fields, 'UCD側障害種別'); break;
          case 'unitId': aValue = getCustomFieldValue(a.custom_fields, '部品ID'); bValue = getCustomFieldValue(b.custom_fields, '部品ID'); break;
          case 'editPgId': aValue = getCustomFieldValue(a.custom_fields, '修正PGID'); bValue = getCustomFieldValue(b.custom_fields, '修正PGID'); break;
          default: return 0;
        }
        if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    model.setFilteredIssues(result);
  };

  const handleProjectClick = (event, elements) => {
    if (elements.length > 0) {
      const clickedIndex = elements[0].index;
      const clickedProject = model.projectData.labels[clickedIndex];
      model.setSelectedFilter({ type: 'project', value: clickedProject });
      applyFiltersAndSort(model.nearDueIssues.filter(issue => issue.project.name === clickedProject));
    }
  };

  const handleDueDateClick = (event, elements) => {
    if (elements.length > 0) {
      const clickedIndex = elements[0].index;
      const clickedDueDate = model.dueDateData.labels[clickedIndex];
      model.setSelectedFilter({ type: 'dueDate', value: clickedDueDate });
      applyFiltersAndSort(model.nearDueIssues.filter(issue => getCustomFieldValue(issue.custom_fields, '回答納期') === clickedDueDate));
    }
  };

  const handlePriorityClick = (event, elements) => {
    if (elements.length > 0) {
      const clickedIndex = elements[0].index;
      const clickedPriority = model.priorityData.labels[clickedIndex];
      model.setSelectedFilter({ type: 'priority', value: clickedPriority });
      applyFiltersAndSort(model.nearDueIssues.filter(issue => issue.priority.name === clickedPriority));
    }
  };

  const handleProjectFjnErrorClick = (event, elements) => {
    if (elements.length > 0) {
      const element = elements[0];
      const projectIndex = element.index;
      const datasetIndex = element.datasetIndex;
      const clickedProject = model.projectFjnErrorData.labels[projectIndex];
      const clickedFjnErrorType = model.projectFjnErrorData.datasets[datasetIndex].label;
      model.setSelectedFilter({ type: 'projectFjnError', value: `${clickedProject} - ${clickedFjnErrorType}` });
      applyFiltersAndSort(model.nearDueIssues.filter(issue => 
        issue.project.name === clickedProject && 
        getCustomFieldValue(issue.custom_fields, 'FJN側障害種別') === clickedFjnErrorType
      ));
    }
  };

  const handleShowAll = () => {
    model.setSelectedFilter(null);
    applyFiltersAndSort(model.nearDueIssues);
  };

  const handleChartToggle = (chart) => {
    model.setShowCharts((prev) => ({ ...prev, [chart]: !prev[chart] }));
  };

  const handleToggleAllCharts = () => {
    model.setShowAllCharts((prev) => !prev);
  };

  const handleFilterChange = (e, column) => {
    const newFilters = { ...model.filters, [column]: e.target.value };
    model.setFilters(newFilters);
    applyFiltersAndSort(model.nearDueIssues, newFilters);
  };

  const handleSort = (key) => {
    const direction = model.sortConfig.key === key && model.sortConfig.direction === 'asc' ? 'desc' : 'asc';
    model.setSortConfig({ key, direction });
    applyFiltersAndSort(model.nearDueIssues, model.filters, { key, direction });
  };

  const handleRefresh = () => {
    model.fetchIssues(model.apiKeys);
  };

  return {
    handleProjectClick,
    handleDueDateClick,
    handlePriorityClick,
    handleProjectFjnErrorClick,
    handleShowAll,
    handleChartToggle,
    handleToggleAllCharts, // Xuất hàm mới
    handleFilterChange,
    handleSort,
    handleRefresh,
  };
};

export default RedmineController;