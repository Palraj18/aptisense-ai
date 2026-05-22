"""Model discovery endpoints for generative models."""
from fastapi import APIRouter
import traceback
import google.generativeai as genai

router = APIRouter(prefix="/api/v1/models", tags=["models"])


@router.get("/list")
def list_models():
    """Attempt to list available generative models accessible to this environment.

    This endpoint is read-only and intended for diagnostics. It will try several
    approaches and return either discovered model names or the diagnostic errors.
    """
    results = {"attempts": []}

    # Attempt 1: try if the genai library exposes any helper
    try:
        helper = getattr(genai, "list_models", None)
        if callable(helper):
            try:
                models = helper()
                # Normalize generator/iterable into a list of model names
                model_names = []
                try:
                    for m in models:
                        # m may be a dict-like or object with name attribute
                        name = None
                        try:
                            name = m.get("name") if isinstance(m, dict) else getattr(m, "name", None)
                        except Exception:
                            name = None
                        model_names.append(name or str(m))
                except TypeError:
                    # not iterable, just stringify
                    model_names = [str(models)]

                results["attempts"].append({"method": "genai.list_models", "models": model_names})
            except Exception as e:
                results["attempts"].append({"method": "genai.list_models", "error": str(e)})
        else:
            results["attempts"].append({"method": "genai.list_models", "result": "not_available"})
    except Exception as e:
        results["attempts"].append({"method": "genai.list_models", "error": str(e)})

    # Attempt 2: use the underlying Google ModelService client if available
    try:
        from google.ai import generativelanguage_v1beta as gl
        from google.ai.generativelanguage_v1beta.services.model_service import ModelServiceClient

        try:
            client = ModelServiceClient()
            # Try a best-effort call; many environments require a parent/project argument
            try:
                resp = client.list_models(request={})
                names = [m.name for m in resp]
                results["attempts"].append({"method": "ModelServiceClient.list_models(request={})", "models": names})
            except Exception as e:
                # Return the exception text to guide next steps
                results["attempts"].append({"method": "ModelServiceClient.list_models(request={})", "error": str(e)})
        except Exception as e:
            results["attempts"].append({"method": "ModelServiceClient()", "error": str(e)})
    except Exception as e:
        results["attempts"].append({"method": "import_model_service", "error": str(e)})

    # Final: return diagnostic info
    return results
