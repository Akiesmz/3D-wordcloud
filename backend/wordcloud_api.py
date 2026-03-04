import math
from collections import Counter

def fibonacci_sphere(samples: int) -> list:
    points = []
    phi = math.pi * (3. - math.sqrt(5.))
    
    for i in range(samples):
        y = 1 - (i / float(samples - 1)) * 2
        radius = math.sqrt(1 - y * y)
        theta = phi * i
        
        x = math.cos(theta) * radius
        z = math.sin(theta) * radius
        
        points.append([x, y, z])
    
    return points

def generate_wordcloud_data(word_counts: Counter, max_words: int = 100) -> list:
    most_common = word_counts.most_common(max_words)
    
    if not most_common:
        return []
    
    min_weight = min(count for _, count in most_common)
    max_weight = max(count for _, count in most_common)
    
    if max_weight == min_weight:
        weight_range = 1
    else:
        weight_range = max_weight - min_weight
    
    num_words = len(most_common)
    positions = fibonacci_sphere(num_words)
    
    words_data = []
    for i, (word, count) in enumerate(most_common):
        normalized_weight = (count - min_weight) / weight_range
        font_size = 0.3 + normalized_weight * 0.7
        
        position = positions[i]
        
        words_data.append({
            "text": word,
            "weight": count,
            "fontSize": round(font_size, 3),
            "position": [round(pos * 3, 3) for pos in position]
        })
    
    return words_data
