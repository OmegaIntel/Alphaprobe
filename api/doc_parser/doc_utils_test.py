from doc_parser.doc_utils import flatten_dict_once, extract_key_val_from_dict

def test_flatten_dict_once():
    dd = {
        1: {
            2: 3,
            4: 5,
        },
        11: {
            12: 13,
            14: 15,
        }
    }
    expected = {1: {2: 3, 4: 5}, 11: {12: 13, 14: 15}, 2: 3, 4: 5, 12: 13, 14: 15}
    assert expected == flatten_dict_once(dd)


def test_extract_key_val_from_dict():
    dd = {
       "simple": "something",
       "complex": {
           "one": "two",
       },
       "products_and_services": [
            {
                "product_or_service": "Alumina",
                "product_description": "Manufacturers sell alumina, also known as aluminum oxide, to industry processors and end markets.",
                "product_percentage": 0.2
            },
            {
                "product_or_service": "Primary Aluminum",
                "product_description": "Primary aluminum manufacturers process alumina into new aluminum products. Primary aluminum comes from ingots, billets and bars, which are often sold to other aluminum manufacturers and downstream processors.",
                "product_percentage": 6.5
            },
            {
                "product_or_service": "Secondary Aluminum",
                "product_description": "Secondary aluminum is aluminum processed from recycled scrap, remelted into ingot, billet and bar forms and sold to other industry processors.",
                "product_percentage": 17.0
            }
        ],
        "market_segmentation": [
            {
                "segment": "Transportation equipment, including defense",
                "segment_description": "The transportation market is the largest purchaser of aluminum, using it to manufacture machinery, equipment, automobile bodies, aircraft bodies, rail structures and other components. The automotive industry is the largest buyer within this sector.",
                "segment_percentage": 35.0
            },
            {
                "segment": "Packaging and containers",
                "segment_description": "Packaging companies use aluminum sheets to manufacture cans and other containers. The metal's longevity and recyclability enable companies to meet sustainable and efficient business goals.",
                "segment_percentage": 22.0
            },
            {
                "segment": "Construction",
                "segment_description": "The construction sector, which includes residential, commercial, utilities and public sector infrastructure construction, is the third-largest purchaser of aluminum products. Utility construction has driven this segment, as these buyers use aluminum products heavily for electrical transmission, similar to industrial clients.",
                "segment_percentage": 14.0
            },
        ],
        "revenue": {
            "revenue_dollars": 45422000000,
            "revenue_cagr_historical": {
                "begin_year": 2005,
                "end_year": 2024,
                "revenue_cagr_value": -1.13
            },
            "revenue_cagr_projected": {
                "begin_year": 2024,
                "end_year": 2030,
                "revenue_cagr_value": 2.52
            }
        },

    }

    metrics = {
        'revenue_dollars': 'revenue.revenue_dollars',
        'segment_percentage': 'market_segmentation.segment_percentage',
        "simple": "simple",
        "complex": "complex.one",
        'product_percentage': 'products_and_services.product_percentage',
    }

    results = {
        'revenue_dollars': 45422000000,
        'segment_percentage': 35.0,
        'product_percentage': 17.0,
        'simple': 'something',
        'complex': 'two',
    }

    for key, val in metrics.items():
        result = extract_key_val_from_dict(dd, val)
        assert results[key] == result
