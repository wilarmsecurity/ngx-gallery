import { Component, Input, HostListener, ViewChild, OnInit,
    HostBinding, DoCheck, ElementRef, AfterViewInit, Output, EventEmitter, ComponentRef } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';

import { NgxGalleryPreviewComponent } from './ngx-gallery-preview.component';
import { NgxGalleryImageComponent } from './ngx-gallery-image.component';
import { NgxGalleryThumbnailsComponent } from './ngx-gallery-thumbnails.component';
import { NgxGalleryHelperService } from './ngx-gallery-helper.service';

import { NgxGalleryOptions } from './ngx-gallery-options.model';
import { NgxGalleryImage } from './ngx-gallery-image.model';
import { NgxGalleryLayout } from './ngx-gallery-layout.model';
import { NgxGalleryOrderedImage } from './ngx-gallery-ordered-image.model';

@Component({
    selector: 'ngx-gallery',
    template: `
    <div class="ngx-gallery-layout {{currentOptions?.layout}}">
        <ngx-gallery-image *ngIf="currentOptions?.image" [style.height]="getImageHeight()" [images]="mediumImages" [clickable]="currentOptions?.preview" [selectedIndex]="selectedIndex" [arrows]="currentOptions?.imageArrows" [arrowsAutoHide]="currentOptions?.imageArrowsAutoHide" [arrowPrevIcon]="currentOptions?.arrowPrevIcon" [arrowNextIcon]="currentOptions?.arrowNextIcon" [swipe]="currentOptions?.imageSwipe" [animation]="currentOptions?.imageAnimation" [size]="currentOptions?.imageSize" [autoPlay]="currentOptions?.imageAutoPlay" [autoPlayInterval]="currentOptions?.imageAutoPlayInterval" [autoPlayPauseOnHover]="currentOptions?.imageAutoPlayPauseOnHover" [infinityMove]="currentOptions?.imageInfinityMove"  [lazyLoading]="currentOptions?.lazyLoading" [actions]="currentOptions?.imageActions" [descriptions]="descriptions" [showDescription]="currentOptions?.imageDescription" [bullets]="currentOptions?.imageBullets" (onClick)="openPreview($event)" (onActiveChange)="selectFromImage($event)"></ngx-gallery-image>

        <ngx-gallery-thumbnails *ngIf="currentOptions?.thumbnails" [style.marginTop]="getThumbnailsMarginTop()" [style.marginBottom]="getThumbnailsMarginBottom()" [style.height]="getThumbnailsHeight()" [images]="smallImages" [links]="currentOptions?.thumbnailsAsLinks ? links : []" [labels]="labels" [linkTarget]="currentOptions?.linkTarget" [selectedIndex]="selectedIndex" [columns]="currentOptions?.thumbnailsColumns" [rows]="currentOptions?.thumbnailsRows" [margin]="currentOptions?.thumbnailMargin" [arrows]="currentOptions?.thumbnailsArrows" [arrowsAutoHide]="currentOptions?.thumbnailsArrowsAutoHide" [arrowPrevIcon]="currentOptions?.arrowPrevIcon" [arrowNextIcon]="currentOptions?.arrowNextIcon" [clickable]="currentOptions?.image || currentOptions?.preview" [swipe]="currentOptions?.thumbnailsSwipe" [size]="currentOptions?.thumbnailSize" [moveSize]="currentOptions?.thumbnailsMoveSize" [order]="currentOptions?.thumbnailsOrder" [remainingCount]="currentOptions?.thumbnailsRemainingCount" [lazyLoading]="currentOptions?.lazyLoading" [actions]="currentOptions?.thumbnailActions"  (onActiveChange)="selectFromThumbnails($event)"></ngx-gallery-thumbnails>

        <!--<ngx-gallery-preview [images]="bigImages"
                             [descriptions]="descriptions"
                             [showDescription]="currentOptions?.previewDescription"
                             [arrowPrevIcon]="currentOptions?.arrowPrevIcon"
                             [arrowNextIcon]="currentOptions?.arrowNextIcon"
                             [closeIcon]="currentOptions?.closeIcon"
                             [fullscreenIcon]="currentOptions?.fullscreenIcon"
                             [spinnerIcon]="currentOptions?.spinnerIcon"
                             [arrows]="currentOptions?.previewArrows"
                             [arrowsAutoHide]="currentOptions?.previewArrowsAutoHide"
                             [swipe]="currentOptions?.previewSwipe"
                             [fullscreen]="currentOptions?.previewFullscreen"
                             [forceFullscreen]="currentOptions?.previewForceFullscreen"
                             [closeOnClick]="currentOptions?.previewCloseOnClick"
                             [closeOnEsc]="currentOptions?.previewCloseOnEsc"
                             [keyboardNavigation]="currentOptions?.previewKeyboardNavigation"
                             [animation]="currentOptions?.previewAnimation"
                             [autoPlay]="currentOptions?.previewAutoPlay"
                             [autoPlayInterval]="currentOptions?.previewAutoPlayInterval"
                             [autoPlayPauseOnHover]="currentOptions?.previewAutoPlayPauseOnHover"
                             [infinityMove]="currentOptions?.previewInfinityMove"
                             [zoom]="currentOptions?.previewZoom"
                             [zoomStep]="currentOptions?.previewZoomStep"
                             [zoomMax]="currentOptions?.previewZoomMax"
                             [zoomMin]="currentOptions?.previewZoomMin"
                             [zoomInIcon]="currentOptions?.zoomInIcon"
                             [zoomOutIcon]="currentOptions?.zoomOutIcon"
                             [actions]="currentOptions?.actions"
                             [rotate]="currentOptions?.previewRotate"
                             [rotateLeftIcon]="currentOptions?.rotateLeftIcon"
                             [rotateRightIcon]="currentOptions?.rotateRightIcon"
                             [download]="currentOptions?.previewDownload"
                             [downloadIcon]="currentOptions?.downloadIcon"
                             [bullets]="currentOptions?.previewBullets"
                             (onClose)="onPreviewClose()"
                             (onOpen)="onPreviewOpen()"
                             (onActiveChange)="previewSelect($event)"
                             [class.ngx-gallery-active]="previewEnabled"></ngx-gallery-preview>-->
    </div>
    `,
    styleUrls: ['./ngx-gallery.component.scss'],
    providers: [NgxGalleryHelperService]
})
export class NgxGalleryComponent implements OnInit, DoCheck, AfterViewInit   {
    @Input() options: NgxGalleryOptions[];
    @Input() images: NgxGalleryImage[];

    @Output() imagesReady = new EventEmitter();
    @Output() change = new EventEmitter<{ index: number; image: NgxGalleryImage; }>();
    @Output() previewOpen = new EventEmitter();
    @Output() previewClose = new EventEmitter();
    @Output() previewChange = new EventEmitter<{ index: number; image: NgxGalleryImage; }>();

    smallImages: string[] | SafeResourceUrl[];
    mediumImages: NgxGalleryOrderedImage[];
    bigImages: string[] | SafeResourceUrl[];
    descriptions: string[];
    links: string[];
    labels: string[];

    oldImages: NgxGalleryImage[];
    oldImagesLength = 0;

    selectedIndex = 0;
    previewEnabled: boolean;

    currentOptions: NgxGalleryOptions;

    private breakpoint: number | undefined = undefined;
    private prevBreakpoint: number | undefined = undefined;
    private fullWidthTimeout: any;

    private previewRef: ComponentRef<NgxGalleryPreviewComponent>;
    /*@ViewChild(NgxGalleryPreviewComponent, { static: true }) preview: NgxGalleryPreviewComponent;*/
    @ViewChild(NgxGalleryImageComponent, { static: true }) image: NgxGalleryImageComponent;
    @ViewChild(NgxGalleryThumbnailsComponent, { static: true }) thubmnails: NgxGalleryThumbnailsComponent;

    @HostBinding('style.width') width: string;
    @HostBinding('style.height') height: string;
    @HostBinding('style.left') left: string;

    constructor(private myElement: ElementRef, private helperService: NgxGalleryHelperService) {}

    ngOnInit() {
        this.options = this.options.map((opt) => new NgxGalleryOptions(opt));
        this.sortOptions();
        this.setBreakpoint();
        this.setOptions();
        this.checkFullWidth();
        if (this.currentOptions) {
            this.selectedIndex = <number>this.currentOptions.startIndex;
        }
    }

    ngDoCheck(): void {
        if (this.images !== undefined && (this.images.length !== this.oldImagesLength)
            || (this.images !== this.oldImages)) {
            this.oldImagesLength = this.images.length;
            this.oldImages = this.images;
            this.setOptions();
            this.setImages();

            if (this.images && this.images.length) {
                this.imagesReady.emit();
            }

            if (this.image) {
                this.image.reset(<number>this.currentOptions.startIndex);
            }

            if (this.currentOptions.thumbnailsAutoHide && this.currentOptions.thumbnails
                && this.images.length <= 1) {
                this.currentOptions.thumbnails = false;
                this.currentOptions.imageArrows = false;
            }

            this.resetThumbnails();
        }
    }

    ngAfterViewInit(): void {
        this.checkFullWidth();
    }

    @HostListener('window:resize') onResize() {
        this.setBreakpoint();

        if (this.prevBreakpoint !== this.breakpoint) {
            this.setOptions();
            this.resetThumbnails();
        }

        if (this.currentOptions && this.currentOptions.fullWidth) {

            if (this.fullWidthTimeout) {
                clearTimeout(this.fullWidthTimeout);
            }

            this.fullWidthTimeout = setTimeout(() => {
                this.checkFullWidth();
            }, 200);
        }
    }

    getImageHeight(): string {
        return (this.currentOptions && this.currentOptions.thumbnails) ?
            this.currentOptions.imagePercent + '%' : '100%';
    }

    getThumbnailsHeight(): string {
        if (this.currentOptions && this.currentOptions.image) {
            return 'calc(' + this.currentOptions.thumbnailsPercent + '% - '
            + this.currentOptions.thumbnailsMargin + 'px)';
        } else {
            return '100%';
        }
    }

    getThumbnailsMarginTop(): string {
        if (this.currentOptions && this.currentOptions.layout === NgxGalleryLayout.ThumbnailsBottom) {
            return this.currentOptions.thumbnailsMargin + 'px';
        } else {
            return '0px';
        }
    }

    getThumbnailsMarginBottom(): string {
        if (this.currentOptions && this.currentOptions.layout === NgxGalleryLayout.ThumbnailsTop) {
            return this.currentOptions.thumbnailsMargin + 'px';
        } else {
            return '0px';
        }
    }

    openPreview(index: number): void {
        if (this.currentOptions.previewCustom) {
            this.currentOptions.previewCustom(index);
        } else {
            this.previewEnabled = true;
            //this.preview.open(index);
            const previewConfig = {
                'images': this.bigImages,
                'descriptions': this.descriptions,
                'showDescription': this.currentOptions.previewDescription,
                'arrowPrevIcon': this.currentOptions.arrowPrevIcon,
                'arrowNextIcon': this.currentOptions.arrowNextIcon,
                'closeIcon': this.currentOptions.closeIcon,
                'fullscreenIcon': this.currentOptions.fullscreenIcon,
                'spinnerIcon': this.currentOptions.spinnerIcon,
                'arrows': this.currentOptions.previewArrows,
                'arrowsAutoHide': this.currentOptions.previewArrowsAutoHide,
                'swipe': this.currentOptions.previewSwipe,
                'fullscreen': this.currentOptions.previewFullscreen,
                'forceFullscreen': this.currentOptions.previewForceFullscreen,
                'closeOnClick': this.currentOptions.previewCloseOnClick,
                'closeOnEsc': this.currentOptions.previewCloseOnEsc,
                'keyboardNavigation': this.currentOptions.previewKeyboardNavigation,
                'animation': this.currentOptions.previewAnimation,
                'autoPlay': this.currentOptions.previewAutoPlay,
                'autoPlayInterval': this.currentOptions.previewAutoPlayInterval,
                'autoPlayPauseOnHover': this.currentOptions.previewAutoPlayPauseOnHover,
                'infinityMove': this.currentOptions.previewInfinityMove,
                'zoom': this.currentOptions.previewZoom,
                'zoomStep': this.currentOptions.previewZoomStep,
                'zoomMax': this.currentOptions.previewZoomMax,
                'zoomMin': this.currentOptions.previewZoomMin,
                'zoomInIcon': this.currentOptions.zoomInIcon,
                'zoomOutIcon': this.currentOptions.zoomOutIcon,
                'actions': this.currentOptions.actions,
                'rotate': this.currentOptions.previewRotate,
                'rotateLeftIcon': this.currentOptions.rotateLeftIcon,
                'rotateRightIcon': this.currentOptions.rotateRightIcon,
                'download': this.currentOptions.previewDownload,
                'downloadIcon': this.currentOptions.downloadIcon,
                'bullets': this.currentOptions.previewBullets,
                'onClose': ($event) => this.onPreviewClose(),
                'onOpen': ($event) => this.onPreviewOpen(),
                'onActiveChange': ($event) => this.previewSelect($event),
                /*[class.ngx-gallery-active]="previewEnabled"*/
            };

            this.previewRef = this.helperService.appendPreviewToBody(NgxGalleryPreviewComponent, previewConfig);
            this.previewRef.instance.open(index);
        }
    }

    onPreviewOpen(): void {
        this.previewOpen.emit();

        if (this.image && this.image.autoPlay) {
            this.image.stopAutoPlay();
        }
    }

    onPreviewClose(): void {
        this.previewEnabled = false;
        this.previewClose.emit();

        if(this.previewRef) {
            this.helperService.destroyPreview(this.previewRef);
            this.previewRef = null;
        }
        if (this.image && this.image.autoPlay) {
            this.image.startAutoPlay();
        }
    }

    selectFromImage(index: number) {
        this.select(index);
    }

    selectFromThumbnails(index: number) {
        this.select(index);

        if (this.currentOptions && this.currentOptions.thumbnails && this.currentOptions.preview
            && (!this.currentOptions.image || this.currentOptions.thumbnailsRemainingCount)) {
            this.openPreview(this.selectedIndex);
        }
    }

    show(index: number): void {
        this.select(index);
    }

    showNext(): void {
        this.image.showNext();
    }

    showPrev(): void {
        this.image.showPrev();
    }

    canShowNext(): boolean {
        if (this.images && this.currentOptions) {
            return (this.currentOptions.imageInfinityMove || this.selectedIndex < this.images.length - 1)
                ? true : false;
        } else {
            return false;
        }
    }

    canShowPrev(): boolean {
        if (this.images && this.currentOptions) {
            return (this.currentOptions.imageInfinityMove || this.selectedIndex > 0) ? true : false;
        } else {
            return false;
        }
    }

    previewSelect(index: number) {
        this.previewChange.emit({index, image: this.images[index]});
    }

    moveThumbnailsRight() {
        this.thubmnails.moveRight();
    }

    moveThumbnailsLeft() {
        this.thubmnails.moveLeft();
    }

    canMoveThumbnailsRight() {
        return this.thubmnails.canMoveRight();
    }

    canMoveThumbnailsLeft() {
        return this.thubmnails.canMoveLeft();
    }

    private resetThumbnails() {
        if (this.thubmnails) {
            this.thubmnails.reset(<number>this.currentOptions.startIndex);
        }
    }

    private select(index: number) {
        this.selectedIndex = index;

        this.change.emit({
            index,
            image: this.images[index]
        });
    }

    private checkFullWidth(): void {
        if (this.currentOptions && this.currentOptions.fullWidth) {
            this.width = document.body.clientWidth + 'px';
            this.left = (-(document.body.clientWidth -
                this.myElement.nativeElement.parentNode.innerWidth) / 2) + 'px';
        }
    }

    private setImages(): void {
        this.smallImages = this.images.map((img) => <string>img.small);
        this.mediumImages = this.images.map((img, i) => new NgxGalleryOrderedImage({
            src: img.medium,
            index: i
        }));
        this.bigImages = this.images.map((img) => <string>img.big);
        this.descriptions = this.images.map((img) => <string>img.description);
        this.links = this.images.map((img) => <string>img.url);
        this.labels = this.images.map((img) => <string>img.label);
    }

    private setBreakpoint(): void {
        this.prevBreakpoint = this.breakpoint;
        let breakpoints;

        if (typeof window !== 'undefined') {
            breakpoints = this.options.filter((opt) => opt.breakpoint >= window.innerWidth)
                .map((opt) => opt.breakpoint);
        }

        if (breakpoints && breakpoints.length) {
            this.breakpoint = breakpoints.pop();
        } else {
            this.breakpoint = undefined;
        }
    }

    private sortOptions(): void {
        this.options = [
            ...this.options.filter((a) => a.breakpoint === undefined),
            ...this.options
                .filter((a) => a.breakpoint !== undefined)
                .sort((a, b) => b.breakpoint - a.breakpoint)
        ];
    }

    private setOptions(): void {
        this.currentOptions = new NgxGalleryOptions({});

        this.options
            .filter((opt) => opt.breakpoint === undefined || opt.breakpoint >= this.breakpoint)
            .map((opt) => this.combineOptions(this.currentOptions, opt));

        this.width = <string>this.currentOptions.width;
        this.height = <string>this.currentOptions.height;
    }

    private combineOptions(first: NgxGalleryOptions, second: NgxGalleryOptions) {
        Object.keys(second).map((val) => first[val] = second[val] !== undefined ? second[val] : first[val]);
    }
}

