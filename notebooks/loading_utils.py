"""A few utils helpful for loading."""

def new_lines_to_list(obj: object) -> object:
    """Replaces new lines with lists in strings"""
    assert type(obj) in (dict, list)

    if isinstance(obj, dict):
        key_vals = list(obj.items())
    else:
        key_vals = list(enumerate(obj))
    for k, v in key_vals:
        if isinstance(v, str):
            if '\n' in v:
                arr = v.split('\n')
                obj[k] = arr
        elif type(v) in (dict, list):
            obj[k] = new_lines_to_list(v)
    return obj
