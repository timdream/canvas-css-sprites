var CanvasCS = {
	init: function () {
		/* Init tabs, provide visual indication on loaded */
		$('.ui-state-disabled').removeClass('ui-state-disabled');
		$('#tabs').tabs(
			{
				select: function (e, u) {
					if ($(u.panel).attr('id') === 'preview') {
						$('#images-container').append($('#images'));
					} else {
						/* Place #images at visible-hack so it's always have a size */
						$('#visible-hack').append($('#images'));
					}
				}
			}
		);

		/* preview image tile */
		$('#images')/*.draggable(
			{
				containment: '#images-container'
			}
		)*/.resizable(
			{
				maxWidth: 2042,
				stop: CanvasCS.update
			}
		).sortable(
			{
				stop: CanvasCS.update
			}
		);

		$('#images li').live(
			'dblclick',
			function () {
				$(this).remove();
				$('#images').sortable('refresh');
				CanvasCS.update();
			}
		);

		/* Add image forms */
		$('#image-new').bind(
			'submit',
			function () {
				if (!$.trim($('#url').val()) || !$.trim($('#class-name').val())) return false;
				var o = CanvasCS.SpriteImage($.trim($('#class-name').val()), $.trim($('#url').val()));
				$('#images').append(o);
				o.find('img').attr('src', $('#url').val());
				$('#url').val('');
				$('#class-name').val('');
				$('#images').sortable('refresh');
				$('#image-new .image-new-ok').show().fadeOut(2000);
				$('#url').focus();
				return false;
			}
		);
		$('#image-bulknew').bind(
			'submit',
			function () {
				var data = $('#urls').val().split('\n');
				$.each(
					data,
					function () {
						var de = this.indexOf(':');
						if (de === -1) {
							return;
						}
						var o = CanvasCS.SpriteImage(
							$.trim(this.substr(0, de)),
							$.trim(this.substring(de+1, this.length))
						);
						$('#images').append(o);
						o.find('img').attr('src', $.trim(this.substr(de+1, this.length)));
					}
				)
				//$('#urls').val('');
				$('#images').sortable('refresh');
				$('#tabs').tabs('select', 3);
				//$('#image-bulknew .image-new-ok').show().fadeOut(2000);
				return false;
			}
		);

		/* adding local image */
		if (window.FileReader || (window.File && window.File.prototype.getAsDataURL)) {
			$('.no-file').hide();
			$('#file').attr('disabled', false).bind(
				'change',
				function () {
					if (!this.files.length) return;
					var f = this.files[0];
					var filename = (f.fileName || f.name).replace(/\.\w+$/, '');
					if (window.FileReader) {
						// FileReader
						var reader = new FileReader();
						reader.onloadend = function (ev) {
							$('#url').val(ev.target.result);
							$('#class-name').val(filename).focus();
						};
						reader.onerror = function () {
							window.alert($('#file-error').val());
						}
						reader.readAsDataURL(f);
					} else {
						// Gecko (Fx30-35) non-standard method
						try {
							$('#url').val(f.getAsDataURL());
							$('#class-name').val(filename).focus();
						} catch (e) {
							window.alert($('#file-error').val());
						}
					}
					$('#image-file')[0].reset();
				}
			);
		}

		/* demosets */
		$('#demo-set input').bind(
			'click',
			function () {
				$('#urls').val($(this).prev().val()).focus();
			}
		);

		/* options form */
		$('#options input').bind(
			'change',
			CanvasCS.update
		);

		/* canvas2image */
		/*$('#save-canvas').bind(
			'click',
			function () {
				Canvas2Image.saveAsPNG($('#sprites').get(0));
			}
		);*/

		/* update for the first time */
		CanvasCS.update();
	},
	SpriteImage: function (className, URL) {
		var i = $(document.createElement('li')).append(
			$(document.createElement('img')).bind(
				'load',
				function () {
					/*$(this).parent().css(
						{
							height: $(this).height() + 'px',
							width: $(this).width() + 'px'
						}
					);*/
					/*$('#tabs').tabs('select', 3);*/
					CanvasCS.update();
				}
			).attr(
				{
					title: className,
					alt: className
				}
			)
		).data(
			'name',
			className
		).data(
			'url',
			URL
		);
		return i;
	},
	update: function () {
		window._paq && window._paq.push(['trackEvent', 'CanvasCS', 'update', '', 1]);

		var $images = $('#images');
		var $sprites = $('#sprites');
		var transBg = $('#config-bgcolor-transparent').attr('checked');
		var transSpacing = $('#config-spacingcolor-transparent').attr('checked');

		/* Disable color controls */
		$('#config-bgcolor').attr('disabled', transBg);
		$('#config-spacingcolor').attr('disabled', transSpacing);

		/* Element that never visible or never assigned doesn't have size */
		var imDim = [
			$images.width() || 200,
			$images.height() || 100
		]

		/* Change the css according to config */
		$.each(
			[$images, $sprites],
			function () {
				this.css(
					{
						width: imDim[0] + 'px',
						height : imDim[1] + 'px',
						backgroundColor: (transSpacing)? null : $('#config-spacingcolor').val()
					}
				);
			}
		);
		$images.toggleClass('transparent-checker', transSpacing);

		$sprites.attr(
			{
				width: imDim[0],
				height : imDim[1]
			}
		);
		$images.find('li').css(
			{
				backgroundColor: (transBg)? null : $('#config-bgcolor').val(),
				marginRight: $('#config-hspacing').val() + 'px',
				marginBottom: $('#config-vspacing').val() + 'px'
			}
		).toggleClass('transparent-checker', transBg);
		/* Pour & empty canvas */
		var ctx = $sprites.get(0).getContext('2d');
		if (transSpacing) {
			ctx.clearRect(0, 0, $('#images').width(), $('#images').height());
		} else {
			ctx.fillStyle = $('#config-spacingcolor').val();
			ctx.fillRect(0, 0, $('#images').width(), $('#images').height());
		}
		/* Copy all images into canvas */
		ctx.fillStyle = $('#config-bgcolor').val();
		var parentOffset = {};
		var d = [];
		/* Show no-image warning if there is no images, $.toggle breaks */
		if ($images.find('li').length) {
			$('.no-image').hide();
		} else {
			$('.no-image').show();
		}

		$images.find('li').each(
			function (i) {
				if (i === 0) {
					/* Let's use first image to detect content positions */
					parentOffset = $(this).offset();
				}
				var imageData = $(this).offset();
				imageData = [
					parseInt(imageData.left - parentOffset.left),
					parseInt(imageData.top - parentOffset.top),
					parseInt($(this).width()),
					parseInt($(this).height()),
					$(this).data('name'),
					$(this).data('url')
				];
				if (transBg) {
					ctx.clearRect(
						imageData[0],
						imageData[1],
						imageData[2],
						imageData[3]
					);
				} else {
					ctx.fillRect(
						imageData[0],
						imageData[1],
						imageData[2],
						imageData[3]
					);
				}
				/* Some times image is not loaded yet */
				try {
					ctx.drawImage(
						$(this).find('img').get(0),
						imageData[0],
						imageData[1]
					);
				} catch (e) {
				}
				d[d.length] = imageData;
			}
		);
		/* Generate CSS */
		var data = '';
		var css = '.sprite {display: block\; background: transparent url(\'...\') no-repeat; text-indent: -10000px; }\n';
		$.each(
			d,
			function (i, o) {
				data += o[4] + ': ' + o[5] + '\n';
				if (o[0] !== 0) {
					o[0] = '-' + o[0].toString(10) + 'px'
				}
				if (o[1] !== 0) {
					o[1] = '-' + o[1].toString(10) + 'px'
				}
				css += '.' + o[4] + ' { background-position: ' + o[0] + ' ' + o[1] + '\; width: ' + o[2] + 'px\; height: ' + o[3] + 'px}\n';
			}
		);
		$('#sprites-data').text(data);
		$('#sprites-css').text(css);
	}
};
$(CanvasCS.init);
