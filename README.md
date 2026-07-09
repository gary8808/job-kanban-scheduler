# Job Kanban Scheduler

A simple web-based job scheduling app with a Kanban-style board. Jobs can be dragged and dropped between team members to assign work.

## Features

- Kanban board with one column per team member
- Drag and drop job cards between workers
- Create, edit and delete jobs
- Add and remove team members
- Search jobs by title, client, location, notes, status or priority
- Local browser storage, so data remains after refresh
- Responsive layout for desktop and mobile

## How to run it

Install Node.js first, then run:

```bash
npm install
npm run dev
```

Open the local address shown in the terminal.

## How to build it

```bash
npm run build
```

The production files will be created in the `dist` folder.

## Notes

This is an MVP. It stores data in the browser using `localStorage`.

For real business use, the next step would be to add:
- User logins
- A database
- Job history/audit trail
- Attachments/photos
- Calendar view
- SMS/email reminders
- FastField or Google Sheets integration
- Permissions for workers versus supervisors