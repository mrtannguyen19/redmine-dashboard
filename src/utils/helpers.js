export const getCustomFieldValue = (customFields, name) => {
    const field = customFields?.find(cf => cf.name === name);
    return field?.value || 'N/A';
  };