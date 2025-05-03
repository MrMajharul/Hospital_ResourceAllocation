from django.shortcuts import render

# Create your views here.
# api/views.py
from django.http import HttpResponse

def index(request):
    return HttpResponse("Welcome to the API index page!")
