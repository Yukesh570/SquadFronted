import React, { useState } from 'react';
// @ts-ignore
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import '../../quillDark.css'; 
import { toast } from "react-toastify";
import { createTemplate } from '../../api/campaignApi/campaignApi';


function TemplateEditor() {
  const [content, setContent] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: any) => {
    e.preventDefault(); 
    const response = await createTemplate({name:name,content:content});

    if (response) {
      toast.success('Template saved');
    } else {
      toast.error('Error saving template');
    }
  };
console.log("fsdasdadas",name);
  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-white dark:bg-gray-800 rounded-lg space-y-4"
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-2 border rounded text-gray-900 dark:text-white bg-white dark:bg-gray-700"
        placeholder="Template Name"

      />
      <div className="quill-container dark:quill-dark">
        <ReactQuill value={content} onChange={setContent} />
      </div>
      <button
        type="submit"
        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
      >
        Save Template
      </button>
    </form>
  );
}

export default TemplateEditor;
