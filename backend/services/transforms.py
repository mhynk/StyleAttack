"""
Style Transformation module

These function wrap the original prompt into different stylistic forms WITHOUT changing sematic intent.
"""

def to_poetry(text: str) -> str:
    """
    Converts baseline prompt into poetry prompt
    :param text: original prompt
    :return: poetry-style prompt
    """
    return f"""
    In whispered rhyme and gentle tone,
    A question seeks to be made known:
    {text}
    Speak now in verse, with flowing grace
    """

STYLE_FUNCS = {
    "poetry": to_poetry,
}