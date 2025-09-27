# Sales Analytics Dashboard

An interactive sales analytics dashboard built with Django 4.2, SQLite, and D3.js. It ingests sales CSV data into a normalized schema and exposes aggregated datasets that power a tabbed D3.js dashboard.

## Core Components
- Django app `orders` handles models, CSV import helpers, JSON endpoints, and dashboard view logic.
- SQLite is the default database; the schema can be migrated to PostgreSQL when needed.
- The frontend is a single page in `templates/dashboard.html` that loads modular charts from `static/js/chart/Q*.js` with shared utilities in `static/js/utils.js`.

## Run Locally
1. Create and activate a virtual environment.
2. Install dependencies with `pip install -r requirements.txt`.
3. Apply migrations with `python manage.py migrate`.
4. (Optional) Import sample data: `python manage.py shell -c "from orders.utils import import_csv_data; import_csv_data('data.csv')"`
5. Start the dev server with `python manage.py runserver` and open http://127.0.0.1:8000/.

## Deploying to PythonAnywhere

### Prerequisites
- A PythonAnywhere account.
- This project pushed to a Git repository (recommended) or archived for upload.
- Python 3.10+ selected for the web app.

### 1. Prepare the project
- Commit any local changes and push them.
- In `visualization_system/settings.py`, set `DEBUG = False` and add your domain to `ALLOWED_HOSTS` (for example `['yourusername.pythonanywhere.com']`).
- Make sure `SECRET_KEY` is a non-default value. You can export it as an environment variable on PythonAnywhere and read it in settings if desired.

### 2. Upload the code
- Log in to PythonAnywhere, open a **Bash** console, and clone your repository:

```
cd ~/ && git clone https://github.com/<your-user>/<your-repo>.git sales-dashboard
```

  Alternatively, upload a ZIP via the **Files** tab and extract it into `~/sales-dashboard`.

### 3. Create a virtual environment
```
cd ~/sales-dashboard
python3.10 -m venv ~/.virtualenvs/sales-dashboard
source ~/.virtualenvs/sales-dashboard/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Configure the web app
- On the **Web** tab, create a new **Manual configuration** web app using Python 3.10.
- Set the **Virtualenv** path to `/home/<username>/.virtualenvs/sales-dashboard`.
- Set the **Working directory** to `/home/<username>/sales-dashboard`.
- Edit the WSGI configuration file (link near the top of the Web tab) so it contains:

```
import os
import sys

project_path = '/home/<username>/sales-dashboard'
if project_path not in sys.path:
    sys.path.insert(0, project_path)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'visualization_system.settings')

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

### 5. Configure environment variables (optional but recommended)
- In the **Web** tab, add entries under **Environment Variables** such as `SECRET_KEY`, `DEBUG`, and `ALLOWED_HOSTS`. Update `settings.py` to read from `os.environ` if you prefer to keep secrets out of source control.

### 6. Static files
- Still on the **Web** tab, add a static file mapping: URL `/static/` -> `/home/<username>/sales-dashboard/static`.
- If you add `STATIC_ROOT` in settings for collected assets, run `python manage.py collectstatic` from the Bash console after setting the mapping.

### 7. Database setup
```
cd ~/sales-dashboard
source ~/.virtualenvs/sales-dashboard/bin/activate
python manage.py migrate
python manage.py shell -c "from orders.utils import import_csv_data; import_csv_data('data.csv')"
```

  Upload `data.csv` to the project directory first if you want the demo dataset.

### 8. Reload the site
- Back on the **Web** tab, click **Reload**. Visit `https://<username>.pythonanywhere.com/` to confirm the dashboard loads.
- Check the **Error log** on PythonAnywhere if you see a 500 error - common causes are missing dependencies, missing migrations, or misconfigured paths.

## Maintenance Tips
- Re-run `pip install -r requirements.txt` inside the virtualenv whenever dependencies change.
- When updating static assets, increment `STATIC_VERSION` or reload the web app so PythonAnywhere serves the fresh files.
- Schedule regular backups or export data with helper functions in `orders/utils.py`.
