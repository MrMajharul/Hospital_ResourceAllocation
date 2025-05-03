from __future__ import absolute_import, unicode_literals
from celery import Celery
app = Celery('task_manager')
app.conf.beat_schedule = {
    'log-tasks-daily': {
        'task': 'tasks.tasks.log_daily_tasks',
        'schedule': crontab(hour=0, minute=0),  # Everyday at midnight
    },
}
