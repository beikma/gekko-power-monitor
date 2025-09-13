import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, MessageSquare } from 'lucide-react';

export function TeamsConfigurationTest() {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');

  console.log('TeamsConfigurationTest render - showForm:', showForm);

  const handleAddClick = () => {
    console.log('Add button clicked!');
    setShowForm(!showForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with name:', name);
    alert(`Form submitted with name: ${name}`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Teams Configuration Test
              </CardTitle>
              <CardDescription>
                Testing the form functionality
              </CardDescription>
            </div>
            <Button onClick={handleAddClick} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {showForm ? 'Hide Form' : 'Show Form'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {showForm && (
        <Card className="border-2 border-blue-500">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-blue-700">
              Test Configuration Form
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-name">Test Name</Label>
                <Input
                  id="test-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter a test name"
                  required
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit">
                  Submit Test
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="p-4 bg-gray-100 rounded-lg">
        <h3 className="font-medium mb-2">Debug Info:</h3>
        <p>showForm: {showForm.toString()}</p>
        <p>name: "{name}"</p>
      </div>
    </div>
  );
}