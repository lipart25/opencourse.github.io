$(document).ready(function(){
    $("#carouselLevel1").owlCarousel({
        items: 1,
        //loop: true,
        onDragged: level1,
        autoHeight:true
    });

    $("#carouselLevel3").owlCarousel({
        items: 1,
        mouseDrag: false,
        touchDrag: false,
        pullDrag: false,
    });
});