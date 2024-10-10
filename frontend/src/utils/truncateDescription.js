export const truncateDescription = (description, length) => {
  if (description.length > length) {
    return description.slice(0, length) + "...";
  }
  return description;
};
