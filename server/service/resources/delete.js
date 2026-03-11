import { deleteResourceById } from '../../repository/resources/delete.js';

export const deleteResource = ({ id }) => {
  if (!id) throw new Error('id is required');
  deleteResourceById(id);
};
