from . import language, ollama, engine

GROUND = ("Use ONLY the document text provided. Do not invent information. "
          "If the document does not contain enough information, say so clearly.")

def fix_language(reply: str, lang: str, model: str | None = None) -> str:
    """If the model answered in the wrong script (e.g. English for a Bengali question), translate it."""
    key = language.SCRIPT_OF.get(lang)
    if not key or language.script_ratio(reply, key) >= 0.4:
        return reply
    name = language.NATIVE.get(lang, lang)
    try:
        return engine.chat(model, [
            {"role": "system", "content": f"You are a professional translator. {language.instruction(lang)}"},
            {"role": "user", "content": f"Translate the following text into {name}. Keep the meaning, lists and formatting. "
                                        f"Output ONLY the translation.\n\n{reply}"}])
    except Exception:
        return reply

def run(task: str, content: str, lang: str, model: str | None = None) -> str:
    system = f"{ollama.TUTOR} {language.instruction(lang)}"
    user = f"{task}\n\n{content}\n\n{language.reminder(lang)}"
    reply = engine.chat(model, [{"role": "system", "content": system}, {"role": "user", "content": user}])
    return fix_language(reply, lang, model)

def out_lang(user, requested: str | None, text: str = "") -> str:
    """Output language: explicit choice > request wording > user's manual setting > interface language."""
    if requested and requested != "auto": return requested
    forced = language.explicit_override(text) if text else None
    if forced: return forced
    if user.response_language != "auto": return user.response_language
    if text: return language.resolve(text, "auto")
    return user.interface_language if user.interface_language in language.NAMES else "en"
