# Generate a list of squares of even numbers from 1 to 20 using list comprehension
even_squares = [x**2 for x in range(1, 21) if x % 2 == 0]

print("Squares of even numbers from 1 to 20:", even_squares)