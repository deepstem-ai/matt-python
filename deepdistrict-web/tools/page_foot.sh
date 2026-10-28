#!/usr/bin/env sh
# Prints the closing </main> and the shared scripts (order matters). Usage: page_foot.sh BASE
B="$1"
cat <<HTML
</main>

<script src="${B}assets/data/content.js"></script>
<script src="${B}assets/data/courses-details.js"></script>
<script src="${B}assets/data/si.js"></script>
<script src="${B}assets/js/partials.js"></script>
<script src="${B}assets/js/consent.js"></script>
<script src="${B}assets/js/app.js"></script>
<script src="${B}assets/js/effects.js"></script>
</body>
</html>
HTML
