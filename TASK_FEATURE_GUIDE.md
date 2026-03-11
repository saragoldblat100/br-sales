# Task Management Feature - Implementation Guide

## Overview
A simple, clean task management system has been added to the Bravo Sales application. Users can create, view, update, and delete tasks with minimal overhead.

## Feature Access

### For Sales Agents
- Click "משימות" (Tasks) button from the main dashboard
- View all tasks (filtered by status if desired)
- Create new tasks
- Update tasks they created
- Assign tasks to team members

### For Managers & Admins
- Access from main dashboard - "משימות" button
- Same functionality as sales agents
- Full visibility into all tasks

## Quick Start - Testing the Feature

### 1. Start Development Server
```bash
cd server
npm run dev
```

### 2. Start Frontend
```bash
cd client
npm run dev
```

### 3. Login
- Use any existing user account from the system

### 4. Navigate to Tasks
- Click the "משימות" (Tasks) button from the main menu
- Or if in manager dashboard, click the Tasks button

## API Endpoints

All endpoints require Bearer token authentication.

### List Tasks
```
GET /api/tasks?status=open
Headers: Authorization: Bearer <token>
Response: { success: true, data: [...] }
```

### Create Task
```
POST /api/tasks
Body: {
  title: string,
  description?: string,
  assignedTo?: userId
}
```

### Update Task
```
PATCH /api/tasks/:id
Body: {
  title?: string,
  description?: string,
  status?: 'open'|'in_progress'|'done'|'cancelled',
  assignedTo?: userId
}
```

### Update Status Only
```
PATCH /api/tasks/:id/status
Body: { status: 'open'|'in_progress'|'done'|'cancelled' }
```

### Delete Task
```
DELETE /api/tasks/:id
```

## Database Schema

```
Task Document:
- _id: ObjectId (auto)
- title: string (required, max 200)
- description: string (optional, max 1000)
- status: enum ['open', 'in_progress', 'done', 'cancelled'] (default: 'open')
- createdBy: ObjectId (User reference, required)
- assignedTo: ObjectId (User reference, optional)
- updatedBy: ObjectId (User reference, optional)
- createdAt: Date (auto)
- updatedAt: Date (auto)
```

## Permissions & Authorization

### Who Can Do What:
- **Create Task**: Any authenticated user
- **View Tasks**: Any authenticated user
- **Edit Task**: Only creator of the task or admin
- **Delete Task**: Only creator of the task or admin
- **Change Status**: Only creator of the task or admin

### Future Enhancements (Not in v1):
- Task priority levels
- Tags/categories
- Comments/notes
- Attachments
- Recurring tasks
- Due dates
- Advanced filtering (assigned to me, created by me)
- Pagination
- Task history/audit log

## File Structure

### Backend
```
server/src/features/tasks/
├── task.model.ts      # MongoDB schema
├── task.service.ts    # Business logic
├── task.routes.ts     # Express routes
└── index.ts          # Exports
```

### Frontend
```
client/src/features/tasks/
├── api/
│   ├── tasks.api.ts   # API client
│   └── index.ts
├── containers/
│   ├── TasksModule.tsx       # Smart container
│   └── TaskDetailsModal.tsx   # Form modal
├── ui/
│   ├── TasksModuleView.tsx      # List view
│   ├── TaskForm.tsx             # Reusable form
│   └── TasksModuleView.module.scss
├── types.ts           # TypeScript interfaces
└── index.ts          # Exports
```

## UI Components

### TasksModuleView
- Main list view showing all tasks
- Columns: Title, Status, Assigned To, Created By, Created Date, Updated Date, Actions
- Status badges with color coding:
  - Red: Open
  - Blue: In Progress
  - Green: Done
  - Gray: Cancelled
- Filter by status dropdown
- New Task button
- Edit/Delete buttons on each row

### TaskDetailsModal
- Create mode: title + description + assign to + submit
- Edit mode: title + description + status + assign to + submit
- Form validation (title required)
- Error messages

## Styling & Icons

### Colors Used
- Open: Red (#fee2e2)
- In Progress: Blue (#dbeafe)
- Done: Green (#dcfce7)
- Cancelled: Gray (#f3f4f6)
- Button: Amber (#bg-amber-50) for dashboard icon

### Icon
- Location: `/client/public/icons/tasks.svg`
- Used in both Sales and Manager dashboards
- Check mark + checkbox style

## Known Limitations (v1)

1. No pagination (all tasks loaded at once)
2. No due dates or time tracking
3. No task priority
4. No comments or discussion threads
5. No file attachments
6. No task templates
7. No recurring tasks
8. No task dependencies
9. Simple status only (no workflow states)
10. No bulk operations

## Testing Scenarios

### Scenario 1: Create & View Task
1. Login as any user
2. Go to Tasks
3. Click "New Task"
4. Fill in title, description, assign to user
5. Click "Create Task"
6. Task appears in list with current user as creator

### Scenario 2: Update Task Status
1. From task list, click Edit button
2. Change status to "In Progress"
3. Click "Update Task"
4. Status badge updates in list

### Scenario 3: Filter by Status
1. From task list, select "In Progress" from filter dropdown
2. Only in-progress tasks shown
3. Select "All" to see all again

### Scenario 4: Permissions
1. Create task as User A
2. Try to edit as User B
3. Should see "Insufficient permissions" error
4. Login as User A again - should be able to edit

## Troubleshooting

### Tasks endpoint returns 401
- Check that Bearer token is in Authorization header
- Verify token hasn't expired (30 min inactivity timeout)
- Try logging out and back in

### Cannot edit task
- Verify you created the task (not another user)
- Admin accounts should be able to edit any task
- Check browser console for specific error

### Create task returns 400 error
- Title is required and must not be empty
- Description maxlength is 1000 characters
- Title maxlength is 200 characters
- Check assignedTo user ID is valid

## Future Development Notes

When extending this feature:
1. Add due dates (createdAt pattern exists)
2. Add task dependencies (reference array)
3. Add comments (separate collection with taskId FK)
4. Add file storage (store file references or URLs)
5. Consider task templates for common tasks
6. Add activity log for task changes
7. Consider notification system for task assignments
8. Add task analytics/reports

## Production Checklist

- [ ] Verify permissions work correctly
- [ ] Test with large number of tasks (performance)
- [ ] Ensure audit logging captures task creation/changes
- [ ] Set up database indexes for common queries
- [ ] Configure rate limiting if needed
- [ ] Test API error handling
- [ ] Verify 401/403 errors are handled in UI
- [ ] Check RTL text direction in Hebrew
- [ ] Mobile responsiveness testing
- [ ] Accessibility review (ARIA labels)

