import { Injectable } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { BehaviorSubject, filter, distinctUntilChanged } from 'rxjs';

export interface Breadcrumb {
    label: string;
    url: string;
}

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
    private readonly _breadcrumbs = new BehaviorSubject<Breadcrumb[]>([]);
    readonly breadcrumbs$ = this._breadcrumbs.asObservable();

    constructor(private router: Router, private route: ActivatedRoute) {
        this.router.events
            .pipe(filter(event => event instanceof NavigationEnd), distinctUntilChanged())
            .subscribe(() => {
                const root = this.route.root;
                const breadcrumbs: Breadcrumb[] = [];
                this.buildBreadcrumbs(root, '', breadcrumbs);
                this._breadcrumbs.next(breadcrumbs);
            });
    }

    private buildBreadcrumbs(route: ActivatedRoute, url: string, breadcrumbs: Breadcrumb[]) {
        const children: ActivatedRoute[] = route.children;

        if (children.length === 0) return;

        for (const child of children) {
            const routeURL = child.snapshot.url.map(segment => segment.path).join('/');
            if (routeURL !== '') {
                url += `/${routeURL}`;
            }

            const label = child.snapshot.data['breadcrumb'] ??
                this.prettifyRoute(routeURL);

            if (label) {
                breadcrumbs.push({ label, url });
            }

            this.buildBreadcrumbs(child, url, breadcrumbs);
        }
    }

    private prettifyRoute(str: string): string {
        return str
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
    }
}