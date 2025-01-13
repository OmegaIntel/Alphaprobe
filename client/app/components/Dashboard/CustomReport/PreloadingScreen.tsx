import React, { useState } from 'react';
import { Button } from "~/components/ui/button";
import { Input } from '~/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Trash2, Edit2, Plus, Search } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SearchForm = () => {
  const [query, setQuery] = useState("");
  const [headings, setHeadings] = useState([]);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [newHeading, setNewHeading] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(-1);

  const handleAddHeading = () => {
    if (newHeading.trim()) {
      if (editingIndex >= 0) {
        const updatedHeadings = [...headings];
        updatedHeadings[editingIndex] = newHeading;
        setHeadings(updatedHeadings);
        setEditingIndex(-1);
      } else {
        setHeadings([...headings, newHeading]);
      }
      setNewHeading("");
    }
  };

  const handleEdit = (index) => {
    setNewHeading(headings[index]);
    setEditingIndex(index);
  };

  const handleDelete = (index) => {
    setDeleteIndex(index);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    const updatedHeadings = headings.filter((_, idx) => idx !== deleteIndex);
    setHeadings(updatedHeadings);
    setShowDeleteDialog(false);
  };

  const handleSubmit = async () => {
    if (!query.trim()) {
      alert("Please enter a search query");
      return;
    }

    const formData = {
      query: query.trim(),
      headings: headings
    };

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log('Success:', data);
      // Handle success (e.g., show success message, clear form, etc.)
    } catch (error) {
      console.error('Error:', error);
      // Handle error (e.g., show error message)
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Search Form</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter your search query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter heading"
            value={newHeading}
            onChange={(e) => setNewHeading(e.target.value)}
          />
          <Button 
            onClick={handleAddHeading}
            variant="outline"
          >
            {editingIndex >= 0 ? 'Update' : 'Add'} Heading
          </Button>
        </div>

        <div className="space-y-2">
          {headings.map((heading, index) => (
            <div key={index} className="flex items-center gap-2 p-2 border rounded">
              <span className="flex-1">{heading}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(index)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button 
          onClick={handleSubmit}
          className="w-full"
          disabled={!query.trim() || headings.length === 0}
        >
          Submit
        </Button>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the heading.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default SearchForm;