# api/urls.py
from django.urls import path
from . import views  # Make sure you import views

urlpatterns = [
    path('', views.index, name='index'),
]
