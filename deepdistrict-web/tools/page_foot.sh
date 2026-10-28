#!/usr/bin/env sh
# Prints the closing </main> and the shared scripts. Usage: page_foot.sh BASE
B="$1"
cat <<HTML
</main>

<script src="${B}assets/data/content.js"></script>
<script src="${B}assets/js/partials.js"></script>
<script src="${B}assets/js/main.js"></script>
</body>
</html>
HTML
