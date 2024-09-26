export const truncateDescription = (description) => {
  if (description.length > 145) {
    return description.slice(0, 145) + "...";
  }
  return description;
};
