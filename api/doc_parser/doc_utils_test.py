
from doc_parser.doc_utils import flatten_dict_once

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
