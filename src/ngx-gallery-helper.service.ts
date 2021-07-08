import { DOCUMENT } from '@angular/common';
import { Injectable, ElementRef, Renderer2, ComponentFactoryResolver, ApplicationRef, Injector, Optional, Inject, Type, ComponentRef, EmbeddedViewRef } from '@angular/core';
import { NgxGalleryPreviewConfig } from './ngx-gallery-preview-config.model';
import { NgxGalleryPreviewComponent } from './ngx-gallery-preview.component';

@Injectable()
export class NgxGalleryHelperService {

    private swipeHandlers: Map<string, Function[]> = new Map<string, Function[]>();

    constructor(private renderer: Renderer2, private cfr: ComponentFactoryResolver,
        private appRef: ApplicationRef,
        private injector: Injector,
        @Optional() @Inject(DOCUMENT) private document: any) { }

    manageSwipe(status: boolean, element: ElementRef, id: string, nextHandler: Function, prevHandler: Function): void {

        const handlers = this.getSwipeHandlers(id);

        // swipeleft and swiperight are available only if hammerjs is included
        try {
            if (status && !handlers) {
                this.swipeHandlers.set(id, [
                    this.renderer.listen(element.nativeElement, 'swipeleft', () => nextHandler()),
                    this.renderer.listen(element.nativeElement, 'swiperight', () => prevHandler())
                ]);
            } else if (!status && handlers) {
                handlers.map((handler) => handler());
                this.removeSwipeHandlers(id);
            }
        } catch (e) { }
    }

    validateUrl(url: string): string {
        if (url.replace) {
            return url.replace(new RegExp(' ', 'g'), '%20')
                .replace(new RegExp('\'', 'g'), '%27');
        } else {
            return url;
        }
    }

    getBackgroundUrl(image: string) {
        return 'url(\'' + this.validateUrl(image) + '\')';
    }

    private getSwipeHandlers(id: string): Function[] | undefined {
        return this.swipeHandlers.get(id);
    }

    private removeSwipeHandlers(id: string): void {
        this.swipeHandlers.delete(id);
    }

    appendPreviewToBody(preview: Type<NgxGalleryPreviewComponent>, config: NgxGalleryPreviewConfig): ComponentRef<NgxGalleryPreviewComponent> {
        const componentRef = this.cfr.resolveComponentFactory(preview).create(this.injector);

        Object.keys(config).forEach((key) => {
            if(typeof config[key] === 'function') {
                componentRef.instance[key].subscribe(config[key]);
            } else {
                componentRef.instance[key] = config[key];
            }
        });

        this.appRef.attachView(componentRef.hostView);

        const domElement: HTMLElement = (componentRef.hostView as EmbeddedViewRef<NgxGalleryPreviewComponent>)
            .rootNodes[0];

        this.document.body.appendChild(domElement);

        return componentRef;
    }

    destroyPreview(componentRef: ComponentRef<NgxGalleryPreviewComponent>): void {
        componentRef.destroy();
        this.appRef.detachView(componentRef.hostView);
    }
}
