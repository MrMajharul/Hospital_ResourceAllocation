from django.test import TestCase

# Create your tests here.
from celery import shared_task
from .models import Task
import datetime

@shared_task
def log_daily_tasks():
    today = datetime.date.today()
    tasks = Task.objects.filter(due_date=today)
    for task in tasks:
        print(f"Today's Task: {task.title} - Due: {task.due_date}")
