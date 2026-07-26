"""
To-Do List — CodeArcade
=========================
Pure Python logic for a to-do list application.

Key concepts: CRUD operations, data serialization, filtering.
"""


class TodoList:
    """Simple to-do list manager."""

    def __init__(self):
        self.tasks = []
        self.next_id = 1

    def add_task(self, title, due_date=None):
        task = {
            'id': self.next_id,
            'title': title,
            'completed': False,
            'due_date': due_date,
        }
        self.tasks.append(task)
        self.next_id += 1
        return task

    def toggle_task(self, task_id):
        for task in self.tasks:
            if task['id'] == task_id:
                task['completed'] = not task['completed']
                return task
        return None

    def delete_task(self, task_id):
        self.tasks = [t for t in self.tasks if t['id'] != task_id]

    def get_tasks(self, filter_status='all'):
        if filter_status == 'active':
            return [t for t in self.tasks if not t['completed']]
        elif filter_status == 'completed':
            return [t for t in self.tasks if t['completed']]
        return self.tasks
