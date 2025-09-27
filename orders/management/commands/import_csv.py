from django.core.management.base import BaseCommand
from orders.utils import import_csv_data


class Command(BaseCommand):
    help = 'Import data from CSV file into database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            default='data.csv',
            help='CSV file to import (default: data.csv)'
        )

    def handle(self, *args, **options):
        csv_file = options['file']
        
        self.stdout.write(
            self.style.SUCCESS(f'Starting import from {csv_file}...')
        )
        
        try:
            result = import_csv_data(csv_file)
            self.stdout.write(
                self.style.SUCCESS(f'Successfully imported {result} records!')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error importing data: {str(e)}')
            )