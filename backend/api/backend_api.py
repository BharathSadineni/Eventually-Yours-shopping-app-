from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import threading
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from utils.domain_gen import get_amazon_domain
from services.amazon_scraper import amazon_category_top_products, scrape_amazon_product
from services.prompt_builder import build_and_get_categories
from services.sorting_algorithm import SortingAlgorithm

app = Flask(__name__)
app.config['APP_NAME'] = 'Eventually Yours Shopping App'
CORS(app)  # Enable CORS for all routes

# Load environment variables
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

# Global variables to store user data and results
user_sessions = {}


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy", 
        "message": "Eventually Yours Shopping App Backend API is running",
        "app_name": app.config['APP_NAME']
    })


@app.route("/api/init-session", methods=["POST"])
def init_session():
    """Initialize a new session when user lands on the page"""
    try:
        data = request.get_json()
        session_id = data.get("session_id")
        print(f"Initializing session: {session_id}")
        
        if not session_id:
            return jsonify({"status": "error", "message": "Session ID is required"}), 400
        
        # Initialize session with empty user data
        user_sessions[session_id] = {"user_data": {}}
        
        print(f"Session initialized: {session_id}")
        print(f"Total sessions now: {len(user_sessions)}")
        print(f"Session keys: {list(user_sessions.keys())}")
        
        return jsonify({
            "status": "success",
            "message": "Session initialized successfully",
            "session_id": session_id
        })
    except Exception as e:
        print(f"Error initializing session: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/user-info", methods=["POST"])
def store_user_info():
    """Store user information from the frontend"""
    try:
        data = request.get_json()
        print(f"Received user info data: {data}")
        
        # Check for session ID in headers first, then in data
        session_id = request.headers.get("X-Session-Id") or data.get("session_id")
        print(f"Session ID from request: {session_id}")

        # Extract and format user data
        user_data = {
            "age": data.get("age", ""),
            "gender": data.get("gender", ""),
            "favorite_categories": data.get("categories", []),
            "interests": data.get("interests", ""),
            "preferred_shopping_method": "online",  # Default since it's a web app
            "user_location": data.get("location", ""),
            "budget_range": (
                f"{data.get('budgetMin', '')}-{data.get('budgetMax', '')}"
                if data.get("budgetMin") is not None
                and data.get("budgetMax") is not None
                else ""
            ),
        }

        # If session_id exists and is valid, update it; otherwise create new one
        if session_id and session_id in user_sessions:
            user_sessions[session_id]["user_data"] = user_data
            print(f"Updated existing session: {session_id}")
        else:
            # Generate a new session ID if none provided or invalid
            session_id = f"session_{len(user_sessions) + 1}"
            user_sessions[session_id] = {"user_data": user_data}
            print(f"Created new session: {session_id}")

        print(f"User data stored for session {session_id}: {user_data}")
        print(f"Total sessions after storing user info: {len(user_sessions)}")
        print(f"Session keys: {list(user_sessions.keys())}")

        # Improved terminal log to reflect all user info fields clearly
        print("User location:", user_data["user_location"])
        print("User profile details:")
        print("Age:", user_data["age"])
        print("Gender:", user_data["gender"])
        print("Budget range:", user_data["budget_range"])
        print(
            "Favorite product categories:", ", ".join(user_data["favorite_categories"])
        )
        print("Interests or hobbies:", user_data["interests"])

        return jsonify(
            {
                "status": "success",
                "message": "User information stored successfully",
                "session_id": session_id,
            }
        )
    except Exception as e:
        print(f"Error storing user info: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


# Helper function to get currency symbol based on user location
def get_currency_symbol(location):
    currency_map = {
        "United States": "$",
        "Canada": "C$",
        "United Kingdom": "£",
        "Germany": "€",
        "France": "€",
        "Japan": "¥",
        "Australia": "A$",
        "Brazil": "R$",
        "India": "₹",
        "China": "¥",
        "Mexico": "$",
        "Italy": "€",
        "Spain": "€",
        "Netherlands": "€",
        "Sweden": "kr",
        "Norway": "kr",
        "Denmark": "kr",
        "Finland": "€",
        "Switzerland": "CHF",
        "Austria": "€",
        "Belgium": "€",
        "Portugal": "€",
        "Ireland": "€",
        "New Zealand": "NZ$",
        "South Korea": "₩",
        "Singapore": "S$",
        "Thailand": "฿",
        "Malaysia": "RM",
        "Philippines": "₱",
        "Indonesia": "Rp",
        "Vietnam": "₫",
        "South Africa": "R",
        "Egypt": "E£",
        "Nigeria": "₦",
        "Kenya": "KSh",
        "Morocco": "MAD",
        "Argentina": "$",
        "Chile": "$",
        "Colombia": "$",
        "Peru": "S/",
        "Venezuela": "Bs",
        "Ecuador": "$",
        "Uruguay": "$",
        "Paraguay": "₲",
        "Bolivia": "Bs",
        "Costa Rica": "₡",
        "Panama": "$",
        "Guatemala": "Q",
        "Honduras": "L",
        "El Salvador": "$",
        "Nicaragua": "C$",
    }
    return currency_map.get(location, "$")


def parse_ai_recommendations(sorted_products_text):
    """Parse AI recommendations text into structured product objects"""
    import re

    # Extract product details using regex
    product_pattern = r"Product: (.*?)\nURL: (.*?)\nPrice: [£$€]?([\d.,]+)\nRating: ([\d.]+)\nImage URL: (.*?)\nReasoning: (.*?)(?=\n\nProduct:|$)"
    matches = re.finditer(product_pattern, sorted_products_text, re.DOTALL)

    ai_recommendations = []
    for match in matches:
        name, url, price_str, rating, image, reasoning = match.groups()

        # Clean price string
        price_clean = price_str.replace(",", "").strip()
        try:
            price = float(price_clean)
        except ValueError:
            price = 0.0

        product = {
            "title": name.strip(),
            "url": url.strip(),
            "price": price,
            "rating": float(rating.strip()),
            "image_url": image.strip(),
            "reasoning": reasoning.strip(),
        }
        ai_recommendations.append(product)

    return ai_recommendations


@app.route("/api/shopping-recommendations", methods=["POST"])
def get_shopping_recommendations():
    """Get product recommendations based on user input and stored user data"""
    try:
        data = request.get_json()
        session_id = data.get("session_id")
        print(f"Received session_id: {session_id}")
        print(f"Available sessions: {list(user_sessions.keys())}")
        print(f"Full request data: {data}")

        if not session_id or session_id not in user_sessions:
            print(f"Session validation failed. session_id: {session_id}, exists: {session_id in user_sessions if session_id else False}")
            return jsonify({"status": "error", "message": "Invalid session"}), 400

        # Get user data from session
        user_data = user_sessions[session_id].get("user_data", {})
        print(f"User data from session: {user_data}")
        
        # Check if user data is empty
        if not user_data or not user_data.get("favorite_categories"):
            print("User data is empty or missing categories")
            return jsonify({
                "status": "error", 
                "message": "No user data found. Please complete your profile first."
            }), 400

        # Extract shopping input
        shopping_input = data.get("shopping_input", {})

        # Build improved user input string for Gemini prompt
        user_input = f"""
        Occasion: {shopping_input.get('occasion', '')}
        Preferred Brands: {shopping_input.get('brandsPreferred', '')}
        Shopping Request: {shopping_input.get('shoppingInput', '')}
        Favorite Categories: {', '.join(user_data.get('favorite_categories', []))}
        Interests or Hobbies: {user_data.get('interests', '')}
        """

        # Get categories from Gemini
        categories = build_and_get_categories(
            GEMINI_API_KEY, user_input, user_data["user_location"], user_data
        )
        print(f"Categories from Gemini: {categories}")

        if not categories:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Failed to get categories from Gemini API",
                    }
                ),
                500,
            )

        # Limit categories to top 7
        categories = categories[:7]

        # Get Amazon domain
        amazon_domain = get_amazon_domain(user_data["user_location"])

        # Dictionary to store category -> products
        category_products = {}

        def fetch_category_products(category):
            urls = amazon_category_top_products(
                category,
                amazon_domain,
                num_results=3,
                budget_range=user_data.get("budget_range"),
            )
            print(f"URLs for category '{category}': {urls}")
            products = []
            if not urls:
                return category, products

            with ThreadPoolExecutor(max_workers=5) as executor:
                futures = {
                    executor.submit(scrape_amazon_product, url): url for url in urls
                }
                for future in as_completed(futures):
                    url = futures[future]
                    try:
                        product = future.result()
                        if product:
                            # Filter products by budget range if price_value is available
                            budget_range = user_data.get("budget_range")
                            if budget_range and product.get("price_value") is not None:
                                try:
                                    low, high = (
                                        budget_range.replace("€", "")
                                        .replace("$", "")
                                        .split("-")
                                    )
                                    low = float(low.strip())
                                    high = float(high.strip())
                                    if low <= product["price_value"] <= high:
                                        products.append(product)
                                except:
                                    products.append(product)
                            else:
                                products.append(product)
                    except Exception as e:
                        print(f"Exception occurred while scraping URL {url}: {e}")

            print(f"Products scraped for category '{category}': {len(products)}")
            return category, products

        # Scrape products for each category
        with ThreadPoolExecutor(max_workers=len(categories)) as category_executor:
            category_futures = [
                category_executor.submit(fetch_category_products, category)
                for category in categories
            ]
            for future in as_completed(category_futures):
                category, products = future.result()
                category_products[category] = products

        # Gather all products
        all_products = []
        for products in category_products.values():
            all_products.extend(products)
        print(f"Total products gathered: {len(all_products)}")

        # Get currency symbol
        currency_symbol = get_currency_symbol(user_data.get("user_location", ""))

        # Now sort these products using the SortingAlgorithm
        sorting_algo = SortingAlgorithm(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
            GEMINI_API_KEY,
        )

        try:
            # Get AI sorted recommendations
            sorted_products_text = sorting_algo.get_sorted_products(
                user_input, user_data, all_products
            )
            print("AI Recommendations Text:")
            print(sorted_products_text)

            # Parse AI recommendations
            ai_recommendations = parse_ai_recommendations(sorted_products_text)
            print(f"Parsed AI recommendations: {len(ai_recommendations)}")

            # Format products for frontend
            formatted_products = []

            # Create a mapping of scraped products by title for easy lookup
            scraped_products_map = {}
            for product in all_products:
                if product and product.get("title"):
                    title_key = product["title"].strip().lower()
                    scraped_products_map[title_key] = product

            # Process AI recommendations and match with scraped data
            for i, ai_product in enumerate(ai_recommendations):
                ai_title = ai_product.get("title", "").strip()
                if not ai_title:
                    continue

                # Try to find matching scraped product
                scraped_product = None
                ai_title_key = ai_title.lower()

                # Exact match first
                if ai_title_key in scraped_products_map:
                    scraped_product = scraped_products_map[ai_title_key]
                else:
                    # Partial match
                    for scraped_title_key, product in scraped_products_map.items():
                        if (
                            ai_title_key in scraped_title_key
                            or scraped_title_key in ai_title_key
                        ):
                            scraped_product = product
                            break

                # Use AI data as primary, scraped data as fallback
                product_data = {
                    "id": str(i + 1),
                    "name": ai_title,
                    "price": ai_product.get("price", 0),
                    "currency": currency_symbol,
                    "image": ai_product.get("image_url", "/placeholder.svg"),
                    "buyUrl": ai_product.get("url", ""),
                    "category": "Recommended",
                    "rating": ai_product.get("rating", 0),
                    "reasoning": ai_product.get("reasoning", "AI recommended product"),
                }

                # Override with scraped data if available and more complete
                if scraped_product:
                    if scraped_product.get("price_value"):
                        product_data["price"] = scraped_product["price_value"]
                    if scraped_product.get("image_url"):
                        product_data["image"] = scraped_product["image_url"]
                    if scraped_product.get("url"):
                        product_data["buyUrl"] = scraped_product["url"]

                    # Parse rating from scraped data
                    if scraped_product.get("average_rating"):
                        try:
                            rating_str = str(scraped_product["average_rating"])
                            rating_clean = "".join(
                                c for c in rating_str if c.isdigit() or c == "."
                            )
                            if rating_clean:
                                scraped_rating = float(rating_clean)
                                product_data["rating"] = min(max(scraped_rating, 0), 5)
                        except:
                            pass

                formatted_products.append(product_data)

            # If no AI recommendations, fall back to scraped products
            if not formatted_products and all_products:
                print("No AI recommendations found, using scraped products as fallback")
                for i, product in enumerate(all_products[:10]):
                    if not product or not product.get("title"):
                        continue

                    rating = 0
                    try:
                        rating_str = str(product.get("average_rating", "0"))
                        rating_clean = "".join(
                            c for c in rating_str if c.isdigit() or c == "."
                        )
                        if rating_clean:
                            rating = min(max(float(rating_clean), 0), 5)
                    except:
                        pass

                    formatted_products.append(
                        {
                            "id": str(i + 1),
                            "name": product["title"],
                            "price": product.get("price_value", 0) or 0,
                            "currency": currency_symbol,
                            "image": product.get("image_url", "/placeholder.svg"),
                            "buyUrl": product.get("url", ""),
                            "category": "General",
                            "rating": rating,
                            "reasoning": "Product recommendation based on your preferences",
                        }
                    )

            # Prepare response
            response_data = {
                "status": "success",
                "categories": categories,
                "products": formatted_products,  # This should now be a list of product objects
                "ai_recommendations": json.dumps(ai_recommendations),
            }

            user_sessions[session_id]["results"] = response_data
            print(f"Response data sent to frontend: {len(formatted_products)} products")
            return jsonify(response_data)

        except Exception as e:
            print(f"Error in AI processing: {e}")

            # Fallback to scraped products only
            fallback_products = []
            for i, product in enumerate(all_products[:10]):
                if not product or not product.get("title"):
                    continue

                rating = 0
                try:
                    rating_str = str(product.get("average_rating", "0"))
                    rating_clean = "".join(
                        c for c in rating_str if c.isdigit() or c == "."
                    )
                    if rating_clean:
                        rating = min(max(float(rating_clean), 0), 5)
                except:
                    pass

                fallback_products.append(
                    {
                        "id": str(i + 1),
                        "name": product["title"],
                        "price": product.get("price_value", 0) or 0,
                        "currency": currency_symbol,
                        "image": product.get("image_url", "/placeholder.svg"),
                        "buyUrl": product.get("url", ""),
                        "category": "General",
                        "rating": rating,
                        "reasoning": "Fallback recommendation",
                    }
                )

            response_data = {
                "status": "success",
                "categories": categories,
                "products": fallback_products,
                "ai_recommendations": json.dumps([]),
            }

            user_sessions[session_id]["results"] = response_data
            return jsonify(response_data)

    except Exception as e:
        print(f"Main error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/export-data/<session_id>", methods=["GET"])
def export_user_data(session_id):
    """Export user data for download"""
    try:
        if session_id not in user_sessions:
            return jsonify({"status": "error", "message": "Invalid session"}), 400

        user_data = user_sessions[session_id]["user_data"]
        return jsonify({"status": "success", "data": user_data})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/cleanup-session", methods=["POST"])
def cleanup_session():
    """Clean up a session when user closes the tab"""
    try:
        data = request.get_json()
        session_id = data.get("session_id")
        
        if session_id and session_id in user_sessions:
            del user_sessions[session_id]
            print(f"Session cleaned up: {session_id}")
            return jsonify({
                "status": "success",
                "message": "Session cleaned up successfully"
            })
        else:
            return jsonify({
                "status": "error",
                "message": "Session not found"
            }), 404

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    print("Starting Shopping Recommendation API...")
    print("API will be available at: http://localhost:5000")
    print("Health check: http://localhost:5000/api/health")
    app.run(debug=True, host="0.0.0.0", port=5000)
