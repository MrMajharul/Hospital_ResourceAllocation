
import calendar

# Create a plain text calendar
cal = calendar.TextCalendar(calendar.SUNDAY)

# Generate the calendar for the year 2025
calendar_2025 = cal.formatyear(2025)

# Print the calendar
print(calendar_2025)