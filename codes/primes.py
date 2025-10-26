import json
import math

def is_prime(num):
    """
    Checks if a number is prime using an efficient method.
    A number is prime if it's greater than 1 and has no divisors other than 1 and itself.
    """
    if num <= 1:
        return False
    # 2 is the only even prime number
    if num == 2:
        return True
    # All other even numbers are not prime
    if num % 2 == 0:
        return False
    
    # Check for odd divisors from 3 up to the square root of the number.
    # We only need to check up to the square root because if n has a divisor
    # larger than its square root, it must also have one smaller.
    # We step by 2 to only check odd numbers.
    for i in range(3, int(math.sqrt(num)) + 1, 2):
        if num % i == 0:
            return False
    
    # If no divisors were found, the number is prime
    return True

def find_n_primes(n):
    """
    Generates a list containing the first N prime numbers.
    """
    if n <= 0:
        return []
        
    primes = []
    num = 2 # Start checking from the first prime number
    
    # Loop until we have found N primes
    while len(primes) < n:
        if is_prime(num):
            primes.append(num)
            # Print the prime number as soon as it's found
            print(f"Found prime #{len(primes)}: {num}")
        num += 1 # Move to the next number to check
        
    return primes

def save_primes_to_json(primes_list, filename="prime_numbers.json"):
    """
    Saves a list of prime numbers to a JSON file.
    The JSON format will be a list of objects:
    [
        {"number": 1, "prime": 2},
        {"number": 2, "prime": 3},
        ...
    ]
    
    Args:
        primes_list (list): The list of prime numbers to save.
        filename (str): The name of the JSON file to create.
    """
    
    # Transform the list of primes into the desired list of dictionaries
    data_to_save = [
        {"number": index, "prime": prime}
        for index, prime in enumerate(primes_list, start=1)
    ]
    
    try:
        # 'w' mode opens the file for writing (creates it if it doesn't exist)
        with open(filename, 'w') as json_file:
            # Use json.dump to write the data to the file
            # indent=4 makes the JSON file human-readable (pretty-prints it)
            json.dump(data_to_save, json_file, indent=4)
                
        print(f"\nSuccessfully saved the first {len(primes_list)} prime numbers to {filename}")
        
    except IOError as e:
        print(f"\nError: Could not write to file {filename}. {e}")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")

# --- Main execution ---
if __name__ == "__main__":
    """
    This block runs when the script is executed directly.
    """
    try:
        # 1. Get user input for N
        n_input = input("How many prime numbers do you want to find? ")
        n = int(n_input)
        
        if n <= 0:
            print("Please enter a positive number.")
        else:
            # 2. Find the prime numbers
            print(f"Finding the first {n} prime numbers... This might take a moment for large N.")
            prime_numbers = find_n_primes(n)
            
            # 3. Save them to a JSON file
            # The file will be named "prime_numbers.json"
            save_primes_to_json(prime_numbers, "prime_numbers.json")
            
    except ValueError:
        # Handle cases where the user doesn't enter a valid number
        print(f"Invalid input. '{n_input}' is not a valid integer. Please run the script again.")
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
