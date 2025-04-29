export const getPriorityEmoji = (priority: string) => {
  switch (priority) {
    case 'High':
      return '🌳'; // Tree for high priority
    case 'Medium':
      return '🌱'; // Sprout for medium priority
    case 'Low':
      return '🫘'; // Bean for low priority
    default:
      return '';
  }
}; 