import React from 'react';
import { Card, Button } from 'antd';

const EditableProjectCard = ({ project, onSave, onCancel, onEdit, handleInputChange }) => {
    return (
        <Card className="text-center bg-[#1f1e23] shadow-lg rounded-lg border-none text-white">
            <div className='flex flex-col items-center'>
                {project.isEditing ? (
                    <>
                        <textarea
                            value={project.text}
                            onChange={(e) => handleInputChange(project.id, 'text', e.target.value)}
                            placeholder="Description"
                            className="mb-2 p-2 rounded-md bg-[#151518] w-full h-32"
                        />
                        <div className="flex gap-4 mt-4 w-full">
                            <Button onClick={() => onSave(project.id, project.text)} type="primary">Save</Button>
                            <Button onClick={() => onCancel(project.id, true)} type="default">Remove</Button>
                        </div>
                    </>
                ) : (
                    <div className='flex flex-row justify-between w-full'>
                        <div className="text-sm mt-3 mr-3 text-left">{project.text}</div>
                        <Button onClick={() => onEdit(project.id)} type="default" className="mt-4">Edit</Button>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default EditableProjectCard;
